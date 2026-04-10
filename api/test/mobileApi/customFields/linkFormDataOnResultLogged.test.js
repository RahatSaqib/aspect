const chai = require('chai')
const sinon = require('sinon')

const { assert } = chai

const {
  onFormDataResultLogged,
  loadSiteAndSampleExternalIdForResult,
  assignFormDataResultIdForSiteAndSampleIfUnset,
} = require('../../../src/mobileApi/customFields/linkFormDataOnResultLogged')

function messageContextWithKnex(knex) {
  return {
    run: async fn => fn(knex),
  }
}

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

      assert.isNull(await loadSiteAndSampleExternalIdForResult(trx, 99))
    })

    it('returns null when sample external id empty after normalize', async () => {
      const trx = sinon.stub().returns({
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves({ siteId: 5, sampleExternalId: '   ' }),
      })

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
    it('runs load then assign with knex from messageContext.run', async () => {
      const update = sinon.stub().resolves(1)
      const whereNull = sinon.stub().returns({ update })
      const formWhere = sinon.stub().returns({ whereNull })

      const resultFirst = sinon.stub().resolves({ siteId: 3, sampleExternalId: 'S1' })
      const resultQb = {
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: resultFirst,
      }

      const knex = sinon.stub()
      knex.withArgs('Result as r').returns(resultQb)
      knex.withArgs('FormData').returns({ where: formWhere })

      await onFormDataResultLogged({ resultId: 88 }, { messageContext: messageContextWithKnex(knex) })

      assert.isTrue(resultFirst.calledOnce)
      assert.isTrue(formWhere.calledWith({ siteId: 3, sampleExternalId: 'S1' }))
      assert.isTrue(whereNull.calledWith('resultId'))
      assert.isTrue(update.calledWith({ resultId: 88 }))
    })

    it('does not touch FormData when load returns null', async () => {
      const knex = sinon.stub()
      knex.withArgs('Result as r').returns({
        join: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub().resolves(null),
      })

      await onFormDataResultLogged({ resultId: 404 }, { messageContext: messageContextWithKnex(knex) })

      assert.equal(knex.withArgs('FormData').callCount, 0)
    })
  })
})
