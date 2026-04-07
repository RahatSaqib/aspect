const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')
const { clientTypes } = require('../../../src/auth/service')

describe('mobileApi site listSites handler', () => {
  let getConstraintsStub
  let getSitesMobileViewStub
  let listSites

  beforeEach(() => {
    getConstraintsStub = sinon.stub().resolves({ partner: { id: 1 } })
    getSitesMobileViewStub = sinon.stub().resolves([])
    ;({ listSites } = proxyquire('../../../src/mobileApi/site/listSites/listSites', {
      '../../../auth/constraints': { getConstraints: getConstraintsStub },
      './db': { getSitesMobileView: getSitesMobileViewStub },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  const credentials = { name: 'clinician' }

  it('should call getSitesMobileView with empty filters when optional query params are absent', async () => {
    await listSites({
      auth: { credentials },
      query: { type: ['clinic'] },
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileViewStub, sinon.match.object, ['clinic'], 'name', {}, true)
  })

  it('should pass nameContains and modifiedSince in filters when present', async () => {
    const modifiedSince = new Date('2025-06-01T12:00:00.000Z')
    await listSites({
      auth: { credentials },
      query: { type: ['lab'], nameContains: 'Day', modifiedSince },
    })

    sinon.assert.calledOnceWithExactly(
      getSitesMobileViewStub,
      sinon.match.object,
      ['lab'],
      'name',
      {
        nameContains: 'Day',
        modifiedSince,
      },
      true
    )
  })

  it('should not pass nameContains when shorter than three characters (bypassing route validation)', async () => {
    await listSites({
      auth: { credentials },
      query: { nameContains: 'ab' },
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileViewStub, sinon.match.object, ['clinic', 'lab'], 'name', {}, true)
  })

  it('should not pass nameContains when empty string', async () => {
    await listSites({
      auth: { credentials },
      query: { nameContains: '' },
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileViewStub, sinon.match.object, ['clinic', 'lab'], 'name', {}, true)
  })

  it('should not pass modifiedSince when null or empty string', async () => {
    await listSites({
      auth: { credentials },
      query: { modifiedSince: null },
    })
    sinon.assert.calledWithMatch(getSitesMobileViewStub, sinon.match.any, sinon.match.any, 'name', {}, true)

    getSitesMobileViewStub.resetHistory()

    await listSites({
      auth: { credentials },
      query: { modifiedSince: '' },
    })
    sinon.assert.calledWithMatch(getSitesMobileViewStub, sinon.match.any, sinon.match.any, 'name', {}, true)
  })

  it('should pass includeStateWideSites false for true_connect (non-reporter; onlyForTransfers in API is shape-only)', async () => {
    await listSites({
      auth: { credentials: { ...credentials, clientType: clientTypes.true_connect } },
      query: { type: ['clinic'] },
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileViewStub, sinon.match.object, ['clinic'], 'name', {}, false)
  })

  it('should pass includeStateWideSites false for web JWT (non-reporter; onlyForTransfers in API is shape-only)', async () => {
    await listSites({
      auth: { credentials: { ...credentials, clientType: clientTypes.web } },
      query: {},
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileViewStub, sinon.match.object, ['clinic', 'lab'], 'name', {}, false)
  })

  it('should pass includeStateWideSites true when clientType is reporter_app (only client where onlyForTransfers is meaningful)', async () => {
    await listSites({
      auth: { credentials: { ...credentials, clientType: clientTypes.reporter_app } },
      query: {},
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileViewStub, sinon.match.object, ['clinic', 'lab'], 'name', {}, true)
  })
})
