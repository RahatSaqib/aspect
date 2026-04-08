const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

describe('mobileApi site listSitesAssigned handler', () => {
  let getConstraintsStub
  let getSitesMobileAssignedSimpleStub
  let listSitesAssigned

  beforeEach(() => {
    getConstraintsStub = sinon.stub().resolves({ partner: { id: 1 } })
    getSitesMobileAssignedSimpleStub = sinon.stub().resolves([])
    ;({ listSitesAssigned } = proxyquire('../../../src/mobileApi/site/listSites/listSitesAssigned', {
      '../../../auth/constraints': { getConstraints: getConstraintsStub },
      './db': { getSitesMobileAssignedSimple: getSitesMobileAssignedSimpleStub },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  const credentials = { name: 'clinician' }

  it('should call getSitesMobileAssignedSimple with empty filters when optional query params are absent', async () => {
    await listSitesAssigned({
      auth: { credentials },
      query: { type: ['clinic'] },
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileAssignedSimpleStub, sinon.match.object, ['clinic'], 'name', {})
  })

  it('should pass nameContains and modifiedSince in filters when present', async () => {
    const modifiedSince = new Date('2025-06-01T12:00:00.000Z')
    await listSitesAssigned({
      auth: { credentials },
      query: { type: ['lab'], nameContains: 'Day', modifiedSince },
    })

    sinon.assert.calledOnceWithExactly(getSitesMobileAssignedSimpleStub, sinon.match.object, ['lab'], 'name', {
      nameContains: 'Day',
      modifiedSince,
    })
  })
})
