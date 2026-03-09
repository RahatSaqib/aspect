const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('mobileApi customFields upsertCustomFields', () => {
  let getUserStub
  let getConstraintsStub
  let getSiteStub
  let transactionStub
  let getSitePartnerIdStub
  let lockPartnerSitesStub
  let getFormDataByPartnerExternalIdStub
  let getFormDataBySiteAndSampleStub
  let insertFormDataStub
  let updateFormDataStub
  let upsertCustomFields

  const trx = { name: 'trx' }
  const request = {
    payload: {
      externalId: 'mobile-form-1',
      sampleExternalId: 'sample-1',
      collectedOn: '2026-01-30T10:00:00.000Z',
      originSiteId: 15,
      customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: { temperature: '37.2' } }],
    },
    auth: {
      credentials: {
        name: 'mobile-user',
      },
    },
  }

  beforeEach(() => {
    getUserStub = sinon.stub().resolves({ id: 44 })
    getConstraintsStub = sinon.stub().resolves({})
    getSiteStub = sinon.stub().resolves({ id: 15 })
    transactionStub = sinon.stub().callsFake(async callback => callback(trx))
    getSitePartnerIdStub = sinon.stub().resolves(91)
    lockPartnerSitesStub = sinon.stub().resolves()
    getFormDataByPartnerExternalIdStub = sinon.stub().resolves(null)
    getFormDataBySiteAndSampleStub = sinon.stub().resolves(null)
    insertFormDataStub = sinon.stub().resolves()
    updateFormDataStub = sinon.stub().resolves()
    ;({ upsertCustomFields } = proxyquire('../../../src/mobileApi/customFields/upsertCustomFields', {
      '../../auth/service': { getUser: getUserStub },
      '../../auth/constraints': { getConstraints: getConstraintsStub },
      '../../site/service': { getSite: getSiteStub },
      '../../db': { knex: { transaction: transactionStub } },
      './db': {
        getSitePartnerId: getSitePartnerIdStub,
        lockPartnerSites: lockPartnerSitesStub,
        getFormDataByPartnerExternalId: getFormDataByPartnerExternalIdStub,
        getFormDataBySiteAndSample: getFormDataBySiteAndSampleStub,
        insertFormData: insertFormDataStub,
        updateFormData: updateFormDataStub,
      },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should update the existing record matched by externalId and allow changing sampleExternalId', async () => {
    getFormDataByPartnerExternalIdStub.resolves({
      id: 8,
      siteId: 15,
      sampleExternalId: 'old-sample',
      externalId: 'mobile-form-1',
    })

    const response = await upsertCustomFields(request)

    assert.deepEqual(response, { ok: true })
    assert.isTrue(getSitePartnerIdStub.calledWith(trx, 15))
    assert.isTrue(lockPartnerSitesStub.calledWith(trx, 91))
    assert.isTrue(updateFormDataStub.calledOnce)
    assert.equal(updateFormDataStub.firstCall.args[1], 8)
    assert.equal(updateFormDataStub.firstCall.args[2].sampleExternalId, 'sample-1')
    assert.equal(updateFormDataStub.firstCall.args[2].externalId, 'mobile-form-1')
    assert.equal(insertFormDataStub.callCount, 0)
  })

  it('should attach a new externalId to an existing site and sample record', async () => {
    getFormDataBySiteAndSampleStub.resolves({
      id: 9,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: null,
    })

    await upsertCustomFields(request)

    assert.isTrue(updateFormDataStub.calledOnce)
    assert.equal(updateFormDataStub.firstCall.args[1], 9)
    assert.equal(updateFormDataStub.firstCall.args[2].externalId, 'mobile-form-1')
    assert.equal(insertFormDataStub.callCount, 0)
  })

  it('should preserve the existing externalId when updating by site and sample without a payload externalId', async () => {
    getFormDataBySiteAndSampleStub.resolves({
      id: 10,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'already-linked',
    })

    await upsertCustomFields({
      ...request,
      payload: {
        ...request.payload,
        externalId: '',
      },
    })

    assert.isTrue(updateFormDataStub.calledOnce)
    assert.equal(updateFormDataStub.firstCall.args[2].externalId, 'already-linked')
  })

  it('should reject when the externalId points to a different site and sample combination', async () => {
    getFormDataByPartnerExternalIdStub.resolves({
      id: 11,
      siteId: 20,
      sampleExternalId: 'sample-2',
      externalId: 'mobile-form-1',
    })
    getFormDataBySiteAndSampleStub.resolves({
      id: 12,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'other-form-id',
    })

    try {
      await upsertCustomFields(request)
      assert.fail('Expected conflict error')
    } catch (error) {
      assert.equal(error.output.statusCode, 409)
      assert.equal(
        error.message,
        'The provided site and sample combination is already linked to a different externalId.'
      )
    }

    assert.equal(updateFormDataStub.callCount, 0)
    assert.equal(insertFormDataStub.callCount, 0)
  })

  it('should reject when the site and sample combination is already linked to a different externalId', async () => {
    getFormDataBySiteAndSampleStub.resolves({
      id: 12,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'other-form-id',
    })

    try {
      await upsertCustomFields(request)
      assert.fail('Expected conflict error')
    } catch (error) {
      assert.equal(error.output.statusCode, 409)
      assert.equal(
        error.message,
        'The provided site and sample combination is already linked to a different externalId.'
      )
    }

    assert.equal(updateFormDataStub.callCount, 0)
    assert.equal(insertFormDataStub.callCount, 0)
  })
})
