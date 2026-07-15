const chai = require('chai')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { allDeviceApprovalToId } = require('../../src/shared/dictionary')

const { assert } = chai

describe('Device reactivate route', () => {
  const path = '/api/device'
  let refDevice
  let approvals
  let testDeviceId
  let alternateSiteId

  before(async () => {
    shared.checkToken(server, path)
    await shared.ensureToken(server)
    approvals = await allDeviceApprovalToId()

    // Use a device site the admin token can actually access (constraints apply on reactivate).
    const listRes = await server.get(`${path}?size=50`).set('Authorization', `Bearer ${shared.token}`)
    assert.equal(listRes.status, 200)
    const accessibleDeviceIds = (listRes.body.data || []).map(d => d.id)
    assert.isAtLeast(accessibleDeviceIds.length, 1, 'Expected at least one accessible device')

    refDevice = await knex('Device')
      .whereIn('id', accessibleDeviceIds)
      .whereNotNull('siteId')
      .first('partnerId', 'siteId', 'deviceTypeId')
    assert.isOk(refDevice, 'Expected an accessible seeded device with a site for reactivate fixtures')

    const accessibleSites = await knex('Device')
      .whereIn('id', accessibleDeviceIds)
      .whereNotNull('siteId')
      .distinct('siteId')
      .pluck('siteId')
    alternateSiteId = accessibleSites.find(siteId => siteId !== refDevice.siteId)
    assert.isOk(alternateSiteId, 'Expected an alternate accessible site for reactivate route fixtures')
  })

  beforeEach(async () => {
    const now = new Date()
    ;[testDeviceId] = await knex('Device').insert({
      partnerId: refDevice.partnerId,
      siteId: refDevice.siteId,
      deviceTypeId: refDevice.deviceTypeId,
      deviceApprovalId: approvals.decommissioned,
      name: `Reactivate workflow device ${now.getTime()}`,
      shortName: `Reactivate workflow ${now.getTime()}`,
      createdOn: now,
      updatedOn: now,
      lastSeenOn: now,
    })
    await knex('FactDeviceFlag').insert({ deviceId: testDeviceId, updatedOn: now })
    await knex('Deployment').insert({
      deviceId: testDeviceId,
      siteId: refDevice.siteId,
      start: null,
      end: null,
      createdOn: now,
      createdBy: 1,
      updatedOn: now,
      updatedBy: 1,
    })
  })

  afterEach(async () => {
    await knex('Deployment').where({ deviceId: testDeviceId }).del()
    await knex('DeviceApprovalLog').where({ deviceId: testDeviceId }).del()
    await knex('FactDeviceFlag').where({ deviceId: testDeviceId }).del()
    await knex('Device').where({ id: testDeviceId }).del()
  })

  it('should reactivate a decommissioned device to approved without changing deployments when site is unchanged', async () => {
    const res = await server
      .post(`${path}/${testDeviceId}/reactivate`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ siteId: refDevice.siteId })

    assert.equal(res.status, 200)
    assert.equal(res.body.data.approvalToken, 'approved')
    assert.equal(res.body.data.siteId, refDevice.siteId)

    const deployments = await knex('Deployment').where({ deviceId: testDeviceId }).orderBy('id', 'asc')
    assert.equal(deployments.length, 1)
    assert.equal(deployments[0].siteId, refDevice.siteId)
    assert.isNull(deployments[0].end)
  })

  it('should reactivate at a different accessible site with a new deployment from today', async () => {
    const res = await server
      .post(`${path}/${testDeviceId}/reactivate`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ siteId: alternateSiteId })

    assert.equal(res.status, 200)
    assert.equal(res.body.data.approvalToken, 'approved')
    assert.equal(res.body.data.siteId, alternateSiteId)

    const deployments = await knex('Deployment').where({ deviceId: testDeviceId }).orderBy('id', 'asc')
    assert.equal(deployments.length, 2)
    assert.equal(deployments[0].siteId, refDevice.siteId)
    assert.isNotNull(deployments[0].end)
    assert.equal(deployments[1].siteId, alternateSiteId)
    assert.isNull(deployments[1].end)
    assert.isNotNull(deployments[1].start)
  })

  it('should reject reactivating a non-decommissioned device', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.approved })

    const res = await server
      .post(`${path}/${testDeviceId}/reactivate`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ siteId: refDevice.siteId })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Only decommissioned devices can be reactivated')
    assert.equal(res.body.errorKeyCode, 'onlyDecommissionedDevicesCanBeReactivated')
  })

  it('should reject reactivating without deployments', async () => {
    await knex('Deployment').where({ deviceId: testDeviceId }).del()

    const res = await server
      .post(`${path}/${testDeviceId}/reactivate`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ siteId: refDevice.siteId })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Device has no deployments to reactivate')
    assert.equal(res.body.errorKeyCode, 'deviceHasNoDeploymentsToReactivate')
  })
})
