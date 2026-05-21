const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('mobileApi customFields syncFormDataToResult', () => {
  afterEach(() => {
    sinon.restore()
  })

  describe('buildResultUpdateFromCustomFieldFragment', () => {
    it('merges patientData and resultData JSON fragments with existing objects', () => {
      const {
        buildResultUpdateFromCustomFieldFragment,
      } = require('../../../src/mobileApi/customFields/syncFormDataToResult')
      const updates = buildResultUpdateFromCustomFieldFragment(
        { patientData: { name: 'Ann' }, resultData: { x: 1 } },
        { name: 'Bob', age: 40 },
        { y: 2 }
      )
      assert.deepEqual(JSON.parse(updates.patientData), { name: 'Ann', age: 40 })
      assert.deepEqual(JSON.parse(updates.resultData), { y: 2, x: 1 })
    })
  })

  describe('syncFormDataToResult', () => {
    it('updates Result when fragment is non-empty', async () => {
      const getCustomFieldsFromTrueConnectFormDataStub = sinon.stub().resolves({
        patientData: { newField: 'v' },
      })
      const update = sinon.stub().resolves(1)
      const trx = sinon.stub()
      trx.withArgs('Result as r').returns({
        leftJoin: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves({
          partnerId: 10,
          assayId: 20,
          diseaseId: 30,
          patientData: '{"old":1}',
          resultData: '{}',
          resultDataHash: 'abc',
          countryAbbreviation: 'BD',
        }),
      })
      trx.withArgs('Result').returns({
        where: sinon.stub().returns({ update }),
      })

      const { syncFormDataToResult } = proxyquire('../../../src/mobileApi/customFields/syncFormDataToResult', {
        './trueConnectCustomFieldsMapping': {
          getCustomFieldsFromTrueConnectFormData: getCustomFieldsFromTrueConnectFormDataStub,
        },
        '../../shared/logger': { debug: sinon.stub(), warn: sinon.stub(), error: sinon.stub() },
      })

      const out = await syncFormDataToResult(
        trx,
        {
          formDataRow: {
            id: 5,
            data: JSON.stringify({
              customFieldsData: [{ formDefinitionExternalId: 'CustomFieldsTB', fields: { x: 1 } }],
            }),
          },
          resultId: 99,
        },
        { isAlreadyLinked: false }
      )

      assert.deepEqual(out, { synced: true })
      assert.isTrue(getCustomFieldsFromTrueConnectFormDataStub.calledOnce)
      assert.isTrue(update.calledOnce)
      const updated = update.firstCall.args[0]
      assert.property(updated, 'patientData')
      assert.equal(updated.resultDataHash, null)
    })

    it('returns empty_fragment when not already linked and mapping yields nothing', async () => {
      const getCustomFieldsFromTrueConnectFormDataStub = sinon.stub().resolves({})
      const trx = sinon.stub()
      trx.withArgs('Result as r').returns({
        leftJoin: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves({
          partnerId: 10,
          assayId: 20,
          diseaseId: 30,
          patientData: '{}',
          resultData: '{}',
          resultDataHash: null,
          countryAbbreviation: 'BD',
        }),
      })

      const { syncFormDataToResult } = proxyquire('../../../src/mobileApi/customFields/syncFormDataToResult', {
        './trueConnectCustomFieldsMapping': {
          getCustomFieldsFromTrueConnectFormData: getCustomFieldsFromTrueConnectFormDataStub,
        },
        '../../shared/logger': { debug: sinon.stub(), warn: sinon.stub(), error: sinon.stub() },
      })

      const out = await syncFormDataToResult(
        trx,
        {
          formDataRow: {
            data: JSON.stringify({ customFieldsData: [{ formDefinitionExternalId: 'X', fields: {} }] }),
          },
          resultId: 1,
        },
        { isAlreadyLinked: false }
      )

      assert.deepEqual(out, { synced: false, reason: 'empty_fragment' })
      assert.equal(trx.withArgs('Result').callCount, 0)
    })
  })
})
