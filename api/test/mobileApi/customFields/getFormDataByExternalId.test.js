const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('mobileApi customFields getFormDataByExternalId', () => {
  let getConstraintsStub
  let getAccessibleFormDataByExternalIdStub
  let getFormDataByExternalId

  beforeEach(() => {
    getConstraintsStub = sinon.stub().resolves({ siteIds: [15] })
    getAccessibleFormDataByExternalIdStub = sinon.stub()
    ;({ getFormDataByExternalId } = proxyquire('../../../src/mobileApi/customFields/getFormDataByExternalId', {
      '../../auth/constraints': { getConstraints: getConstraintsStub },
      './db': { getAccessibleFormDataByExternalId: getAccessibleFormDataByExternalIdStub },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return a serialized FormData entry', async () => {
    getAccessibleFormDataByExternalIdStub.resolves({
      id: 5,
      siteId: 15,
      resultId: null,
      sampleExternalId: 'sample-1',
      externalId: 'mobile-form-1',
      collectedOn: '2026-01-30T10:00:00.000Z',
      data: JSON.stringify({ customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: {} }] }),
    })

    const response = await getFormDataByExternalId({
      params: { externalId: 'mobile-form-1' },
      auth: { credentials: { name: 'mobile-user' } },
    })

    assert.deepEqual(response, {
      ok: true,
      data: {
        id: 5,
        siteId: 15,
        resultId: null,
        sampleExternalId: 'sample-1',
        externalId: 'mobile-form-1',
        collectedOn: '2026-01-30T10:00:00.000Z',
        customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: {} }],
      },
    })
  })

  it('should return not found when the entry does not exist', async () => {
    getAccessibleFormDataByExternalIdStub.resolves(null)

    try {
      await getFormDataByExternalId({
        params: { externalId: 'missing-id' },
        auth: { credentials: { name: 'mobile-user' } },
      })
      assert.fail('Expected not found error')
    } catch (error) {
      assert.equal(error.output.statusCode, 404)
      assert.equal(error.message, 'FormData entry not found.')
    }
  })
})
