const chai = require('chai')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { allDeviceApprovalToId } = require('../../src/shared/dictionary')

const { assert } = chai

describe('Device decommission route', () => {
  const path = '/api/device'
  let refDevice
  let approvals
  let testDeviceId

  before(async () => {
    shared.checkToken(server, path)
    await shared.ensureToken(server)
    approvals = await allDeviceApprovalToId()

    // Use a device site the admin token can actually access (constraints apply on decommission).
    const listRes = await server.get(`${path}?size=50`).set('Authorization', `Bearer ${shared.token}`)
    assert.equal(listRes.status, 200)
    const accessibleDeviceIds = (listRes.body.data || []).map(d => d.id)
    assert.isAtLeast(accessibleDeviceIds.length, 1, 'Expected at least one accessible device')

    refDevice = await knex('Device')
      .whereIn('id', accessibleDeviceIds)
      .whereNotNull('siteId')
      .first('partnerId', 'siteId', 'deviceTypeId')
    assert.isOk(refDevice, 'Expected an accessible seeded device with a site for decommission fixtures')
  })

  beforeEach(async () => {
    const now = new Date()
    ;[testDeviceId] = await knex('Device').insert({
      partnerId: refDevice.partnerId,
      siteId: refDevice.siteId,
      deviceTypeId: refDevice.deviceTypeId,
      deviceApprovalId: approvals.pendingDeployment,
      name: `Decommission workflow device ${now.getTime()}`,
      shortName: `Decommission workflow ${now.getTime()}`,
      createdOn: now,
      updatedOn: now,
      lastSeenOn: now,
    })
    await knex('FactDeviceFlag').insert({ deviceId: testDeviceId, updatedOn: now })
  })

  afterEach(async () => {
    await knex('Instrument').where({ deviceId: testDeviceId }).del()
    await knex('Deployment').where({ deviceId: testDeviceId }).del()
    await knex('DeviceApprovalLog').where({ deviceId: testDeviceId }).del()
    await knex('FactDeviceFlag').where({ deviceId: testDeviceId }).del()
    await knex('Device').where({ id: testDeviceId }).del()
  })

  it('should decommission an approved device with a deployment', async () => {
    const now = new Date()
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.approved })
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

    const res = await server
      .post(`${path}/${testDeviceId}/decommission`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send()

    assert.equal(res.status, 200)
    assert.equal(res.body.data.approvalToken, 'decommissioned')

    const logs = await knex('DeviceApprovalLog').where({ deviceId: testDeviceId }).orderBy('id', 'asc')
    assert.equal(logs.length, 1)
    assert.equal(logs[0].deviceApprovalId, approvals.decommissioned)
  })

  it('should reject decommissioning an approved device without deployments', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.approved })

    const res = await server
      .post(`${path}/${testDeviceId}/decommission`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send()

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Device must have a deployment to be decommissioned')
    assert.equal(res.body.errorKeyCode, 'deviceMustHaveDeploymentToBeDecommissioned')
  })

  it('should reject decommissioning a pending-deployment device', async () => {
    const res = await server
      .post(`${path}/${testDeviceId}/decommission`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send()

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Only approved devices can be decommissioned')
    assert.equal(res.body.errorKeyCode, 'onlyApprovedDevicesCanBeDecommissioned')
  })

  it('should reject decommissioning an already-decommissioned device', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.decommissioned })

    const res = await server
      .post(`${path}/${testDeviceId}/decommission`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send()

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Device is already decommissioned')
    assert.equal(res.body.errorKeyCode, 'deviceAlreadyDecommissioned')
  })

  it('should block deployment edits while the device is decommissioned', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.decommissioned })

    const res = await server
      .post(`${path}/${testDeviceId}/deployments/persist`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ changes: [{ action: 'add', siteId: refDevice.siteId, start: null, end: null }] })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Deployments cannot be edited for a decommissioned device')
    assert.equal(res.body.errorKeyCode, 'deploymentsCannotBeEditedForDecommissionedDevice')
  })

  it('should block editing device details while the device is decommissioned', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.decommissioned })
    const attemptedNotes = 'should not persist'

    const res = await server
      .put(`${path}/${testDeviceId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ name: 'Blocked device edit', notes: attemptedNotes })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'A decommissioned device cannot be edited')
    assert.equal(res.body.errorKeyCode, 'decommissionedDeviceCannotBeEdited')

    const device = await knex('Device').where({ id: testDeviceId }).first('notes')
    assert.notEqual(device.notes, attemptedNotes)
  })

  it('should block moving instruments off a decommissioned device', async () => {
    await knex('Device').where({ id: testDeviceId }).update({ deviceApprovalId: approvals.decommissioned })
    const [instrumentId] = await knex('Instrument').insert({
      deviceId: testDeviceId,
      serial: `DECOM-${Date.now()}`,
      active: true,
    })

    const res = await server
      .post(`${path}/transfer-instrument-to-new-device`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ instrumentId, siteId: refDevice.siteId })

    assert.equal(res.status, 409)
    assert.equal(res.body.message, 'Instruments cannot be moved for a decommissioned device')
  })
})
