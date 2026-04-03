const chai = require('chai')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { allDeviceApprovalToId } = require('../../src/shared/dictionary')

const { assert } = chai

describe('Device approval workflow routes', () => {
  const path = '/api/device'
  let refDevice
  let approvals
  let testDeviceId
  let alternateSiteId

  before(async () => {
    shared.checkToken(server, path)
    approvals = await allDeviceApprovalToId()
    refDevice = await knex('Device').whereNotNull('siteId').first('partnerId', 'siteId', 'deviceTypeId')
    const alternateSite = await knex('Site')
      .where('partnerId', refDevice.partnerId)
      .whereNot('id', refDevice.siteId)
      .first('id')
    alternateSiteId = alternateSite.id
  })

  beforeEach(async () => {
    const now = new Date()
    ;[testDeviceId] = await knex('Device').insert({
      partnerId: refDevice.partnerId,
      siteId: refDevice.siteId,
      deviceTypeId: refDevice.deviceTypeId,
      deviceApprovalId: approvals.pendingDeployment,
      name: `Approval workflow device ${now.getTime()}`,
      shortName: `Approval workflow ${now.getTime()}`,
      createdOn: now,
      updatedOn: now,
      lastSeenOn: now,
    })
    await knex('FactDeviceFlag').insert({ deviceId: testDeviceId, updatedOn: now })
  })

  afterEach(async () => {
    await knex('Deployment').where({ deviceId: testDeviceId }).del()
    await knex('DeviceApprovalLog').where({ deviceId: testDeviceId }).del()
    await knex('FactDeviceFlag').where({ deviceId: testDeviceId }).del()
    await knex('Device').where({ id: testDeviceId }).del()
  })

  it('should decommission a device from the approval workflow endpoint', async () => {
    const res = await server
      .post(`${path}/${testDeviceId}/approval`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ action: 'decommission' })

    assert.equal(res.status, 200)
    assert.equal(res.body.data.approvalToken, 'decommissioned')

    const logs = await knex('DeviceApprovalLog').where({ deviceId: testDeviceId }).orderBy('id', 'asc')
    assert.equal(logs.length, 1)
    assert.equal(logs[0].deviceApprovalId, approvals.decommissioned)
  })

  it('should reactivate a device to pending deployment when it has no deployments', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.decommissioned })

    const res = await server
      .post(`${path}/${testDeviceId}/approval`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ action: 'reactivate' })

    assert.equal(res.status, 200)
    assert.equal(res.body.data.approvalToken, 'pendingDeployment')
  })

  it('should reactivate a device to approved when it has deployments', async () => {
    const now = new Date()
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.decommissioned })
    await knex('Deployment').insert({
      deviceId: testDeviceId,
      siteId: alternateSiteId,
      start: null,
      end: null,
      createdOn: now,
      createdBy: 1,
      updatedOn: now,
      updatedBy: 1,
    })

    const res = await server
      .post(`${path}/${testDeviceId}/approval`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ action: 'reactivate' })

    assert.equal(res.status, 200)
    assert.equal(res.body.data.approvalToken, 'approved')
  })

  it('should block deployment edits while the device is decommissioned', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.decommissioned })

    const res = await server
      .post(`${path}/${testDeviceId}/deployments/persist`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ changes: [{ action: 'add', siteId: alternateSiteId, start: null, end: null }] })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Deployments cannot be edited for a decommissioned device')
  })
})
