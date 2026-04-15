const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

/**
 * trx stub so knex.transaction(cb) runs real selectCandidateResultIdForSiteAndSample logic against mocked builders.
 */
function buildTrxWithCandidateSelect({ candidateRows = [] } = {}) {
  const trx = sinon.stub()
  trx.raw = sinon.stub().returns('__raw__')
  trx.withArgs('FormData as fd').returns({
    select: sinon.stub().returnsThis(),
    whereRaw: sinon.stub().returnsThis(),
  })
  const select = sinon.stub().resolves(candidateRows)
  trx.withArgs('Result as r').returns({
    join: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis(),
    whereNotNull: sinon.stub().returnsThis(),
    whereNotExists: sinon.stub().returnsThis(),
    select,
  })
  return { trx, candidateResultSelect: select }
}

describe('mobileApi customFields upsertFormData', () => {
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
  let upsertFormData
  let trx
  let candidateResultSelectStub
  let syncFormDataToResultStub

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
    const built = buildTrxWithCandidateSelect({ candidateRows: [] })
    trx = built.trx
    candidateResultSelectStub = built.candidateResultSelect
    transactionStub = sinon.stub().callsFake(async callback => callback(trx))
    getSitePartnerIdStub = sinon.stub().resolves(91)
    lockPartnerSitesStub = sinon.stub().resolves()
    getFormDataByPartnerExternalIdStub = sinon.stub().resolves(null)
    getFormDataBySiteAndSampleStub = sinon.stub().resolves(null)
    insertFormDataStub = sinon.stub().resolves()
    updateFormDataStub = sinon.stub().resolves()
    syncFormDataToResultStub = sinon.stub().resolves({ synced: true })
    ;({ upsertFormData } = proxyquire('../../../src/mobileApi/customFields/upsertFormData', {
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
      './syncFormDataToResult': { syncFormDataToResult: syncFormDataToResultStub },
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

    const response = await upsertFormData(request)

    assert.deepEqual(response, { ok: true })
    assert.isTrue(getSitePartnerIdStub.calledWith(trx, 15))
    assert.isTrue(lockPartnerSitesStub.calledWith(trx, 91))
    assert.isTrue(updateFormDataStub.calledOnce)
    assert.equal(updateFormDataStub.firstCall.args[1], 8)
    assert.equal(updateFormDataStub.firstCall.args[2].sampleExternalId, 'sample-1')
    assert.equal(updateFormDataStub.firstCall.args[2].externalId, 'mobile-form-1')
    assert.equal(updateFormDataStub.firstCall.args[2].resultId, null)
    assert.equal(insertFormDataStub.callCount, 0)
    assert.isTrue(candidateResultSelectStub.calledOnce)
    assert.equal(syncFormDataToResultStub.callCount, 0)
  })

  it('should attach a new externalId to an existing site and sample record', async () => {
    getFormDataBySiteAndSampleStub.resolves({
      id: 9,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: null,
    })

    await upsertFormData(request)

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

    await upsertFormData({
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
      await upsertFormData(request)
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
      await upsertFormData(request)
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

  it('should pick the candidate Result whose startedOn is closest to collectedOn', async () => {
    candidateResultSelectStub.resolves([
      { id: 100, startedOn: '2026-01-30T09:00:00.000Z', endedOn: '2026-01-30T12:00:00.000Z' },
      { id: 200, startedOn: '2026-01-30T10:30:00.000Z', endedOn: '2026-01-30T11:00:00.000Z' },
    ])
    getFormDataBySiteAndSampleStub.resolves({
      id: 20,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'mobile-form-1',
      resultId: null,
    })

    await upsertFormData(request)

    assert.equal(updateFormDataStub.firstCall.args[2].resultId, 200)
  })

  it('should set resultId from candidate Result when none is stored yet', async () => {
    candidateResultSelectStub.resolves([
      { id: 999, startedOn: '2026-01-30T10:00:00.000Z', endedOn: '2026-01-30T11:00:00.000Z' },
    ])
    getFormDataBySiteAndSampleStub.resolves({
      id: 20,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'mobile-form-1',
      resultId: null,
    })

    await upsertFormData(request)

    assert.equal(updateFormDataStub.firstCall.args[2].resultId, 999)
    assert.isTrue(candidateResultSelectStub.calledOnce)
    assert.isTrue(syncFormDataToResultStub.calledOnce)
  })

  it('should preserve resultId and skip candidate lookup when already linked', async () => {
    getFormDataByPartnerExternalIdStub.resolves({
      id: 8,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'mobile-form-1',
      resultId: 55,
    })

    await upsertFormData(request)

    assert.equal(updateFormDataStub.firstCall.args[2].resultId, 55)
    assert.equal(candidateResultSelectStub.callCount, 0)
    assert.isTrue(syncFormDataToResultStub.calledOnce)
  })

  it('should omit resultId when candidate exists but sync does not apply', async () => {
    syncFormDataToResultStub.resolves({ synced: false, reason: 'empty_fragment' })
    candidateResultSelectStub.resolves([
      { id: 999, startedOn: '2026-01-30T10:00:00.000Z', endedOn: '2026-01-30T11:00:00.000Z' },
    ])
    getFormDataBySiteAndSampleStub.resolves({
      id: 20,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'mobile-form-1',
      resultId: null,
    })

    await upsertFormData(request)

    assert.equal(updateFormDataStub.firstCall.args[2].resultId, null)
    assert.isTrue(syncFormDataToResultStub.calledOnce)
  })

  it('should reject when already linked and sync fails', async () => {
    syncFormDataToResultStub.resolves({ synced: false, reason: 'empty_fragment' })
    getFormDataByPartnerExternalIdStub.resolves({
      id: 8,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'mobile-form-1',
      resultId: 55,
    })

    try {
      await upsertFormData(request)
      assert.fail('Expected bad request')
    } catch (error) {
      assert.equal(error.output.statusCode, 400)
      assert.include(error.message, 'Unable to sync custom fields')
    }

    assert.equal(updateFormDataStub.callCount, 0)
  })

  it('should reject changing sampleExternalId when linked to a result', async () => {
    getFormDataByPartnerExternalIdStub.resolves({
      id: 8,
      siteId: 15,
      sampleExternalId: 'sample-1',
      externalId: 'mobile-form-1',
      resultId: 55,
    })

    try {
      await upsertFormData({
        ...request,
        payload: {
          ...request.payload,
          sampleExternalId: 'other-sample',
        },
      })
      assert.fail('Expected conflict error')
    } catch (error) {
      assert.equal(error.output.statusCode, 409)
      assert.include(error.message, 'sampleExternalId cannot change')
    }

    assert.equal(updateFormDataStub.callCount, 0)
    assert.equal(candidateResultSelectStub.callCount, 0)
  })
})
