const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

/**
 * Build a minimal trx() mock that knows how to answer the query chains
 * run by persistDeploymentChanges in a happy-path scenario with one active
 * deployment and no pre-existing deployments.
 *
 * - resultingDeployments: rows returned by the Deployment load after inserts/updates.
 * - unassignedResultIds: ids returned by the collector's pluck() call (per span, in
 *   order) — pass an array of arrays for multi-span, or a single array which is
 *   reused for every span.
 * - deviceApiKeyId: value returned by Device.first('deviceApiKeyId') near the end.
 * - collectorChains: optional out-array that receives each collector chain so
 *   tests can inspect the whereRaw call sequence per span.
 * - formDataChains: optional out-array to inspect FormData where predicates.
 */
function buildTrx({
  resultingDeployments,
  unassignedResultIds,
  deviceApiKeyId = null,
  collectorChains = null,
  formDataChains = null,
}) {
  const trx = sinon.stub()

  const perSpanIds = Array.isArray(unassignedResultIds[0])
    ? unassignedResultIds
    : resultingDeployments.map(() => unassignedResultIds)

  const insertChain = { insert: sinon.stub().resolves([1]) }
  const deploymentLoadChain = {
    where: sinon.stub().returnsThis(),
    orderByRaw: sinon.stub().returnsThis(),
    select: sinon.stub().resolves(resultingDeployments),
    insert: sinon.stub().resolves([1]),
    update: sinon.stub().resolves(1),
    del: sinon.stub().resolves(1),
  }
  trx.withArgs('Deployment').returns(deploymentLoadChain)

  trx.withArgs('Result').returns({
    where: sinon.stub().returnsThis(),
    update: sinon.stub().resolves(0),
  })

  let collectorCallCount = 0
  trx.withArgs('Result as r').callsFake(() => {
    // The collector runs once per span first (Promise.all over map), so calls
    // 1..N belong to it. Subsequent calls are updateResultSites / subqueries.
    if (collectorCallCount < resultingDeployments.length) {
      const ids = perSpanIds[collectorCallCount]
      collectorCallCount += 1
      const chain = {
        where: sinon.stub().returnsThis(),
        whereNull: sinon.stub().returnsThis(),
        whereRaw: sinon.stub().returnsThis(),
        join: sinon.stub().returnsThis(),
        whereNotNull: sinon.stub().returnsThis(),
        whereExists: sinon.stub().returnsThis(),
        pluck: sinon.stub().resolves(ids),
      }
      // `modify` in production invokes a callback that adds whereRaw clauses;
      // forward the call to `chain` so tests can observe the branching.
      chain.modify = sinon.stub().callsFake(function (fn) {
        fn(chain)
        return chain
      })
      if (collectorChains) {
        collectorChains.push(chain)
      }
      return chain
    }
    // Subsequent calls: updateSampleOriginSiteId (sampleIdsInSpanQuery builder)
    // and updateResultSites' UPDATE. They are chained subqueries; return a
    // generic chain whose terminal methods resolve with benign values.
    return {
      where: sinon.stub().returnsThis(),
      whereNotNull: sinon.stub().returnsThis(),
      whereRaw: sinon.stub().returnsThis(),
      modify: sinon.stub().returnsThis(),
      select: sinon.stub().returnsThis(),
      join: sinon.stub().returnsThis(),
      update: sinon.stub().resolves(0),
    }
  })
  const resultAsR2Chain = {
    where: sinon.stub().returnsThis(),
    whereRaw: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    as: sinon.stub().returnsThis(),
  }
  trx.withArgs('Result as r2').returns(resultAsR2Chain)
  trx.withArgs('Result as r3').returns({
    select: sinon.stub().returnsThis(),
    whereRaw: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis(),
  })
  trx.withArgs('Sample as s').returns({
    whereIn: sinon.stub().returnsThis(),
    whereExists: sinon.stub().returnsThis(),
    whereNotExists: sinon.stub().returnsThis(),
    update: sinon.stub().resolves(0),
  })

  const deviceUpdateFirstStub = sinon
    .stub()
    .resolves(deviceApiKeyId != null ? { deviceApiKeyId } : { deviceApiKeyId: null })
  trx.withArgs('Device').returns({
    where: sinon.stub().returnsThis(),
    update: sinon.stub().resolves(1),
    first: deviceUpdateFirstStub,
    count: sinon.stub().returnsThis(),
  })
  trx.withArgs('DeviceApiKey').returns({
    where: sinon.stub().returnsThis(),
    update: sinon.stub().resolves(1),
  })

  trx.withArgs('FormData as fd').callsFake(() => {
    const chain = {
      select: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      whereNull: sinon.stub().returnsThis(),
      whereRaw: sinon.stub().returnsThis(),
    }
    if (formDataChains) {
      formDataChains.push(chain)
    }
    return chain
  })

  trx.raw = sinon.stub().callsFake((...args) => ({ raw: args }))

  return { trx, insertChain, deploymentLoadChain }
}

function loadModule({ transactStub, syncDeviceApprovalFromDeploymentsStub }) {
  return proxyquire('../../../src/device/deployment/persistDeploymentChanges', {
    '../../db': { transact: transactStub },
    '../../auth/constraints': {
      getUserFromCredentials: sinon.stub().resolves({ id: 42, timezoneIANA: 'Etc/UTC' }),
    },
    '../common/logic': { recalculateDeviceFactTables: sinon.stub().resolves() },
    '../common/deviceApprovalService': {
      assertDeviceIsNotDecommissioned: sinon.stub().resolves(),
      syncDeviceApprovalFromDeployments:
        syncDeviceApprovalFromDeploymentsStub || sinon.stub().resolves({ changed: false }),
    },
  })
}

function buildRequest({ messageContext, changes }) {
  return {
    params: { deviceId: 10 },
    auth: { credentials: { name: 'tester' } },
    payload: { changes },
    plugins: { messageContext },
  }
}

describe('persistDeploymentChanges', () => {
  afterEach(() => sinon.restore())

  it('dispatches resultSiteAssigned for each collected id after the transaction commits', async () => {
    const { trx } = buildTrx({
      resultingDeployments: [{ id: 1, siteId: 20, start: null, end: null }],
      unassignedResultIds: [42, 43],
    })

    const transactStub = sinon.stub().callsFake(async cb => {
      await cb(trx)
    })

    const { persistDeploymentChanges } = loadModule({ transactStub })

    const dispatchStub = sinon.stub()
    const boundCtx = { resultSiteAssigned: dispatchStub }
    const bindActionCreators = sinon.stub().returns(boundCtx)
    const messageContext = { bindActionCreators }

    const res = await persistDeploymentChanges(
      buildRequest({ messageContext, changes: [{ action: 'add', siteId: 20, start: null, end: null }] })
    )

    assert.deepEqual(res, { ok: true })
    assert.isTrue(transactStub.calledOnce)
    assert.isTrue(bindActionCreators.calledOnce)
    const bindArg = bindActionCreators.firstCall.args[0]
    assert.property(bindArg, 'resultSiteAssigned')
    assert.isFunction(bindArg.resultSiteAssigned)
    assert.equal(dispatchStub.callCount, 2)
    assert.deepEqual(dispatchStub.firstCall.args, [42])
    assert.deepEqual(dispatchStub.secondCall.args, [43])
  })

  it('does not dispatch when the collector returns no ids', async () => {
    const { trx } = buildTrx({
      resultingDeployments: [{ id: 1, siteId: 20, start: null, end: null }],
      unassignedResultIds: [],
    })

    const transactStub = sinon.stub().callsFake(async cb => {
      await cb(trx)
    })

    const { persistDeploymentChanges } = loadModule({ transactStub })

    const dispatchStub = sinon.stub()
    const bindActionCreators = sinon.stub().returns({ resultSiteAssigned: dispatchStub })
    const messageContext = { bindActionCreators }

    await persistDeploymentChanges(
      buildRequest({ messageContext, changes: [{ action: 'add', siteId: 20, start: null, end: null }] })
    )

    assert.equal(bindActionCreators.callCount, 0)
    assert.equal(dispatchStub.callCount, 0)
  })

  it('collector applies lower/upper bounds only when deployment start/end are non-null', async () => {
    // Four-span timeline exercising every null-combination the DB allows:
    //   span A: start=null, end=D1      (oldest — only upper bound)
    //   span B: start=D2,   end=D3      (middle — both bounds)
    //   span C: start=D4,   end=null    (active — only lower bound)
    // And, in a separate invocation below, the degenerate single span with
    //   start=null, end=null (the only case where a deployment can cover all time).
    const spans = [
      { id: 1, siteId: 11, start: null, end: new Date('2024-03-31T00:00:00Z') },
      { id: 2, siteId: 12, start: new Date('2024-04-01T00:00:00Z'), end: new Date('2024-06-30T00:00:00Z') },
      { id: 3, siteId: 13, start: new Date('2024-07-01T00:00:00Z'), end: null },
    ]
    const collectorChains = []
    const { trx } = buildTrx({
      resultingDeployments: spans,
      unassignedResultIds: [[1], [2], [3]],
      collectorChains,
    })

    const transactStub = sinon.stub().callsFake(async cb => {
      await cb(trx)
    })
    const { persistDeploymentChanges } = loadModule({ transactStub })

    const dispatchStub = sinon.stub()
    const bindActionCreators = sinon.stub().returns({ resultSiteAssigned: dispatchStub })
    const messageContext = { bindActionCreators }

    await persistDeploymentChanges(
      buildRequest({
        messageContext,
        // Changes list doesn't drive the collector; it reads from the loaded resultingDeployments.
        changes: [{ action: 'add', siteId: 13, start: '2024-07-01', end: null }],
      })
    )

    assert.equal(collectorChains.length, 3, 'one collector chain per deployment span')

    const whereRawCalls = chain => chain.whereRaw.getCalls().map(c => c.args[0])
    const dateBoundCalls = chain =>
      whereRawCalls(chain).filter(sql => sql.includes('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?))'))

    // Oldest span (start=null): only the upper-bound clause is attached.
    assert.deepEqual(dateBoundCalls(collectorChains[0]), ['DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) <= ?'])
    // Middle span: both bounds attached.
    assert.deepEqual(dateBoundCalls(collectorChains[1]), [
      'DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) >= ?',
      'DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) <= ?',
    ])
    // Active span (end=null): only the lower-bound clause is attached.
    assert.deepEqual(dateBoundCalls(collectorChains[2]), ['DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) >= ?'])

    // Every chain is device-scoped and restricted to results with sample external ids.
    for (const chain of collectorChains) {
      assert.isTrue(chain.where.calledWith('r.deviceId', 10))
      assert.isTrue(chain.whereNotNull.calledWith('s.externalId'))
      assert.isTrue(chain.whereExists.calledOnce)
      assert.isTrue(chain.pluck.calledWith('r.id'))
    }

    // All three ids are deduped and forwarded for dispatch.
    assert.equal(dispatchStub.callCount, 3)
    assert.deepEqual(
      dispatchStub.getCalls().map(c => c.args[0]),
      [1, 2, 3]
    )
  })

  it('collector adds no date bounds when a single deployment has both start and end null', async () => {
    const collectorChains = []
    const formDataChains = []
    const { trx } = buildTrx({
      resultingDeployments: [{ id: 1, siteId: 20, start: null, end: null }],
      unassignedResultIds: [99],
      collectorChains,
      formDataChains,
    })

    const transactStub = sinon.stub().callsFake(async cb => {
      await cb(trx)
    })
    const { persistDeploymentChanges } = loadModule({ transactStub })

    const dispatchStub = sinon.stub()
    const bindActionCreators = sinon.stub().returns({ resultSiteAssigned: dispatchStub })
    const messageContext = { bindActionCreators }

    await persistDeploymentChanges(
      buildRequest({ messageContext, changes: [{ action: 'add', siteId: 20, start: null, end: null }] })
    )

    assert.equal(collectorChains.length, 1)
    // Neither bound is attached — the collector matches every unassigned result on the device.
    const dateBounds = collectorChains[0].whereRaw
      .getCalls()
      .map(c => c.args[0])
      .filter(sql => sql.includes('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?))'))
    assert.equal(dateBounds.length, 0)
    assert.equal(formDataChains.length, 1)
    assert.isTrue(formDataChains[0].where.calledWith('fd.siteId', 20))
    assert.isTrue(formDataChains[0].whereNull.calledWith('fd.resultId'))
    assert.isTrue(formDataChains[0].whereRaw.calledWith('fd.sampleExternalId = TRIM(s.externalId)'))
    assert.equal(dispatchStub.callCount, 1)
    assert.deepEqual(dispatchStub.firstCall.args, [99])
  })

  it('collector deduplicates ids that appear in multiple spans', async () => {
    // Unlikely in practice (spans are non-overlapping), but the helper's dedupe
    // guarantees each resultId is dispatched at most once regardless of input.
    const { trx } = buildTrx({
      resultingDeployments: [
        { id: 1, siteId: 11, start: null, end: new Date('2024-03-31T00:00:00Z') },
        { id: 2, siteId: 12, start: new Date('2024-04-01T00:00:00Z'), end: null },
      ],
      unassignedResultIds: [
        [7, 8],
        [8, 9],
      ],
    })

    const transactStub = sinon.stub().callsFake(async cb => {
      await cb(trx)
    })
    const { persistDeploymentChanges } = loadModule({ transactStub })

    const dispatchStub = sinon.stub()
    const bindActionCreators = sinon.stub().returns({ resultSiteAssigned: dispatchStub })
    const messageContext = { bindActionCreators }

    await persistDeploymentChanges(
      buildRequest({
        messageContext,
        changes: [{ action: 'add', siteId: 12, start: '2024-04-01', end: null }],
      })
    )

    assert.deepEqual(
      dispatchStub.getCalls().map(c => c.args[0]),
      [7, 8, 9]
    )
  })

  it('does not dispatch in the empty-deployments branch (all deployments removed)', async () => {
    // resultingDeployments is [] so persistDeploymentChanges takes the
    // "clear site assignments" branch and returns before the collector runs.
    const { trx } = buildTrx({ resultingDeployments: [], unassignedResultIds: [] })

    const transactStub = sinon.stub().callsFake(async cb => {
      await cb(trx)
    })

    const syncStub = sinon.stub().resolves({ changed: false })
    const { persistDeploymentChanges } = loadModule({
      transactStub,
      syncDeviceApprovalFromDeploymentsStub: syncStub,
    })

    const dispatchStub = sinon.stub()
    const bindActionCreators = sinon.stub().returns({ resultSiteAssigned: dispatchStub })
    const messageContext = { bindActionCreators }

    await persistDeploymentChanges(buildRequest({ messageContext, changes: [{ action: 'delete', id: 99 }] }))

    assert.isTrue(syncStub.calledOnce)
    assert.equal(bindActionCreators.callCount, 0)
    assert.equal(dispatchStub.callCount, 0)
  })
})
