const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('mobileApi customFields linkFormDataOnResultLogged', () => {
  afterEach(() => {
    sinon.restore()
  })

  describe('loadSiteAndSampleExternalIdForResult', () => {
    it('returns normalized site and sample when row exists', async () => {
      const first = sinon.stub().resolves({ siteId: 12, sampleExternalId: '  sid-1  ' })
      const qb = {
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first,
      }
      const trx = sinon.stub().returns(qb)

      const {
        loadSiteAndSampleExternalIdForResult,
      } = require('../../../src/mobileApi/customFields/linkFormDataOnResultLogged')

      const out = await loadSiteAndSampleExternalIdForResult(trx, 44)

      assert.deepEqual(out, { siteId: 12, sampleExternalId: 'sid-1' })
      assert.isTrue(trx.calledWith('Result as r'))
      assert.isTrue(first.calledWith('r.siteId', 's.externalId as sampleExternalId'))
    })

    it('returns null when no row', async () => {
      const trx = sinon.stub().returns({
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves(null),
      })

      const {
        loadSiteAndSampleExternalIdForResult,
      } = require('../../../src/mobileApi/customFields/linkFormDataOnResultLogged')

      assert.isNull(await loadSiteAndSampleExternalIdForResult(trx, 99))
    })

    it('returns null when sample external id empty after normalize', async () => {
      const trx = sinon.stub().returns({
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves({ siteId: 5, sampleExternalId: '   ' }),
      })

      const {
        loadSiteAndSampleExternalIdForResult,
      } = require('../../../src/mobileApi/customFields/linkFormDataOnResultLogged')

      assert.isNull(await loadSiteAndSampleExternalIdForResult(trx, 1))
    })
  })

  describe('assignFormDataResultIdForSiteAndSampleIfUnset', () => {
    it('updates FormData when ids are valid', async () => {
      const update = sinon.stub().resolves(1)
      const whereNull = sinon.stub().returns({ update })
      const where = sinon.stub().returns({ whereNull })
      const trx = sinon.stub()
      trx.withArgs('FormData').returns({ where })

      const {
        assignFormDataResultIdForSiteAndSampleIfUnset,
      } = require('../../../src/mobileApi/customFields/linkFormDataOnResultLogged')

      const n = await assignFormDataResultIdForSiteAndSampleIfUnset(trx, {
        siteId: 7,
        sampleExternalId: 'abc',
        resultId: 100,
      })

      assert.equal(n, 1)
      assert.isTrue(where.calledWith({ siteId: 7, sampleExternalId: 'abc' }))
      assert.isTrue(whereNull.calledWith('resultId'))
      assert.isTrue(update.calledWith({ resultId: 100 }))
    })

    it('returns 0 when siteId missing', async () => {
      const trx = sinon.stub()
      const {
        assignFormDataResultIdForSiteAndSampleIfUnset,
      } = require('../../../src/mobileApi/customFields/linkFormDataOnResultLogged')

      const n = await assignFormDataResultIdForSiteAndSampleIfUnset(trx, {
        siteId: null,
        sampleExternalId: 'a',
        resultId: 1,
      })
      assert.equal(n, 0)
      assert.equal(trx.callCount, 0)
    })
  })

  describe('onFormDataResultLogged', () => {
    it('runs transaction: load form, sync, update resultId when sync succeeds', async () => {
      const syncStub = sinon.stub().resolves({ synced: true })
      const formUpdate = sinon.stub().resolves(1)
      const formRow = {
        id: 3,
        data: JSON.stringify({ customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: {} }] }),
      }

      let formDataSelectReturned = false
      const trxInner = sinon.stub()
      trxInner.withArgs('FormData').callsFake(() => {
        if (!formDataSelectReturned) {
          formDataSelectReturned = true
          const chain = {
            whereNull: sinon.stub().returnsThis(),
            forUpdate: sinon.stub().returnsThis(),
            first: sinon.stub().resolves(formRow),
          }
          chain.where = sinon.stub().returns(chain)
          return chain
        }
        return {
          where: sinon.stub().returns({ update: formUpdate }),
        }
      })

      const transactionStub = sinon.stub().callsFake(async cb => cb(trxInner))

      const resultFirst = sinon.stub().resolves({ siteId: 3, sampleExternalId: 'S1' })
      const resultQb = {
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: resultFirst,
      }

      const runKnex = sinon.stub()
      runKnex.withArgs('Result as r').returns(resultQb)
      runKnex.transaction = transactionStub

      const loggerStub = { warn: sinon.stub(), debug: sinon.stub(), error: sinon.stub() }
      const { onFormDataResultLogged } = proxyquire('../../../src/mobileApi/customFields/linkFormDataOnResultLogged', {
        '../../shared/logger': loggerStub,
        './syncFormDataToResult': { syncFormDataToResult: syncStub },
      })

      await onFormDataResultLogged({ resultId: 88 }, { messageContext: { run: async fn => fn(runKnex) } })

      assert.isTrue(transactionStub.calledOnce)
      assert.isTrue(syncStub.calledOnce)
      assert.isTrue(formUpdate.calledOnce)
      assert.deepEqual(formUpdate.firstCall.args[0], { resultId: 88 })
    })

    it('does not update FormData when sync fails', async () => {
      const syncStub = sinon.stub().resolves({ synced: false, reason: 'empty_fragment' })
      const formUpdate = sinon.stub().resolves(1)
      const formRow = {
        id: 3,
        data: JSON.stringify({ customFieldsData: [] }),
      }

      let formDataSelectReturned = false
      const trxInner = sinon.stub()
      trxInner.withArgs('FormData').callsFake(() => {
        if (!formDataSelectReturned) {
          formDataSelectReturned = true
          const chain = {
            whereNull: sinon.stub().returnsThis(),
            forUpdate: sinon.stub().returnsThis(),
            first: sinon.stub().resolves(formRow),
          }
          chain.where = sinon.stub().returns(chain)
          return chain
        }
        return {
          where: sinon.stub().returns({ update: formUpdate }),
        }
      })

      const transactionStub = sinon.stub().callsFake(async cb => cb(trxInner))

      const runKnex = sinon.stub()
      runKnex.withArgs('Result as r').returns({
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves({ siteId: 3, sampleExternalId: 'S1' }),
      })
      runKnex.transaction = transactionStub

      const loggerStub = { warn: sinon.stub(), debug: sinon.stub(), error: sinon.stub() }
      const { onFormDataResultLogged } = proxyquire('../../../src/mobileApi/customFields/linkFormDataOnResultLogged', {
        '../../shared/logger': loggerStub,
        './syncFormDataToResult': { syncFormDataToResult: syncStub },
      })

      await onFormDataResultLogged({ resultId: 88 }, { messageContext: { run: async fn => fn(runKnex) } })

      assert.equal(formUpdate.callCount, 0)
    })

    it('handles RESULT_SITE_ASSIGNED actions the same way as TRUENAT_RESULT_LOGGED', async () => {
      const syncStub = sinon.stub().resolves({ synced: true })
      const formUpdate = sinon.stub().resolves(1)
      const formRow = {
        id: 9,
        data: JSON.stringify({ customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: {} }] }),
      }

      let formDataSelectReturned = false
      const trxInner = sinon.stub()
      trxInner.withArgs('FormData').callsFake(() => {
        if (!formDataSelectReturned) {
          formDataSelectReturned = true
          const chain = {
            whereNull: sinon.stub().returnsThis(),
            forUpdate: sinon.stub().returnsThis(),
            first: sinon.stub().resolves(formRow),
          }
          chain.where = sinon.stub().returns(chain)
          return chain
        }
        return {
          where: sinon.stub().returns({ update: formUpdate }),
        }
      })

      const transactionStub = sinon.stub().callsFake(async cb => cb(trxInner))

      const runKnex = sinon.stub()
      runKnex.withArgs('Result as r').returns({
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves({ siteId: 3, sampleExternalId: 'S1' }),
      })
      runKnex.transaction = transactionStub

      const loggerStub = { warn: sinon.stub(), debug: sinon.stub(), error: sinon.stub() }
      const { onFormDataResultLogged } = proxyquire('../../../src/mobileApi/customFields/linkFormDataOnResultLogged', {
        '../../shared/logger': loggerStub,
        './syncFormDataToResult': { syncFormDataToResult: syncStub },
      })

      await onFormDataResultLogged(
        { type: 'RESULT_SITE_ASSIGNED', resultId: 77 },
        { messageContext: { run: async fn => fn(runKnex) } }
      )

      assert.isTrue(syncStub.calledOnce)
      assert.isTrue(formUpdate.calledOnce)
      assert.deepEqual(formUpdate.firstCall.args[0], { resultId: 77 })
    })

    it('does not touch FormData when load returns null', async () => {
      const transactionStub = sinon.stub()
      const runKnex = sinon.stub()
      runKnex.withArgs('Result as r').returns({
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves(null),
      })
      runKnex.transaction = transactionStub

      const loggerStub2 = { warn: sinon.stub(), debug: sinon.stub(), error: sinon.stub() }
      const { onFormDataResultLogged } = proxyquire('../../../src/mobileApi/customFields/linkFormDataOnResultLogged', {
        '../../shared/logger': loggerStub2,
        './syncFormDataToResult': { syncFormDataToResult: sinon.stub() },
      })

      await onFormDataResultLogged({ resultId: 404 }, { messageContext: { run: async fn => fn(runKnex) } })

      assert.equal(transactionStub.callCount, 0)
    })
  })
})
