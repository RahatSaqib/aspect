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
    refDevice = await knex('Device').whereNotNull('siteId').first('partnerId', 'siteId', 'deviceTypeId')
    assert.isOk(refDevice, 'Expected a seeded device with a site for reactivate route fixtures')

    const alternateSite = await knex('Site')
      .where('partnerId', refDevice.partnerId)
      .whereNot('id', refDevice.siteId)
      .first('id')
    assert.isOk(alternateSite, 'Expected an alternate site for reactivate route fixtures')
    alternateSiteId = alternateSite.id

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
  })

  it('should reject reactivating without deployments', async () => {
    await knex('Deployment').where({ deviceId: testDeviceId }).del()

    const res = await server
      .post(`${path}/${testDeviceId}/reactivate`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ siteId: refDevice.siteId })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Device has no deployments to reactivate')
  })
})
