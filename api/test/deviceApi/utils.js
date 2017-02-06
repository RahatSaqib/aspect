const _ = require('lodash')
const chai = require('chai')
const jwt = require('jsonwebtoken')
const config = require('../../src/config')
const { run } = require('../../src/db')

const assert = chai.assert

const devicePath = '/device'

function* getApiKey(knex, deviceId) {
  const apiKey = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({ 'd.id': +deviceId, 'dak.revoked': 0 })
    .first('dak.id as dak')
  return apiKey && jwt.sign(apiKey, config.secret)
}

function* deleteTestDataFromCheckpoint(knex, checkpoint, deviceIds) {
  const minDeviceLogUpdate = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dl.checkpoint', checkpoint)
    .orderBy('dlu.id', 'desc')
    .first('dlu.id as id')
  if (!minDeviceLogUpdate) {
    // if no updates, nothing to delete
    return
  }
  const minDeviceLogUpdateId = minDeviceLogUpdate.id

  const deviceUpdates = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dlu.id', '>=', minDeviceLogUpdateId)
    .whereIn('dl.deviceId', deviceIds)
    .select(
      'dlu.id', 'dlu.deviceLogId', 'dlu.resultId', 'dlu.deviceOperationId')

  const deviceLogIds = _.uniq(_.map(deviceUpdates, 'deviceLogId'))
  const resultIds = _.uniq(_.map(deviceUpdates, 'resultId'))
  const opIds = _.uniq(_.map(deviceUpdates, 'deviceOperationId'))

  yield knex('DeviceLogUpdate').whereIn('deviceLogId', deviceLogIds).delete()
  yield knex('DeviceLog').whereIn('id', deviceLogIds).delete()
  yield knex('InventoryLog').whereIn('resultId', resultIds).delete()
  yield knex('ResultWorkflowLog').whereIn('resultId', resultIds).delete()
  yield knex('Result').whereIn('id', resultIds).delete()
  yield knex('DeviceOperation').whereIn('id', opIds).delete()
}

function* getDeviceConfigurationData(knex, deviceId) {
  const { configurationData } = yield knex('Device')
    .where({ id: deviceId })
    .first('configurationData')

  return JSON.parse(configurationData || null)
}

function* getLastDeviceOperation(knex, deviceId) {
  const lastOpId = yield* getLastDeviceOperationId(knex, deviceId)
  if (!lastOpId) {
    return null
  }

  const op = yield knex('DeviceOperation')
    .where({ id: lastOpId })
    .first('id', 'startedOn', 'endedOn', 'data')
  return Object.assign(op, { data: JSON.parse(op.data || null) })
}

function* getLastDeviceOperationData(knex, deviceId) {
  const op = yield* getLastDeviceOperation(knex, deviceId)
  return op ? op.data : null
}

function* getLastDeviceOperationId(knex, deviceId) {
  const op = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dl.deviceId', deviceId)
    .whereNotNull('dlu.deviceOperationId')
    .orderBy('dlu.id', 'desc')
    .first('dlu.deviceOperationId as id')
  return op && op.id
}

function* getLastResultId(knex, deviceId) {
  const result = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dl.deviceId', deviceId)
    .whereNotNull('dlu.resultId')
    .orderBy('dlu.id', 'desc')
    .first('dlu.resultId')
  return result && result.resultId
}

function createTestContext(server, auth) {
  return new DeviceApiTestContext(server, auth)
}

class DeviceApiTestContext {
  constructor(server, auth) {
    this.auth = auth

    this.server = server
    this.checkpoint = null
    this.deviceIds = []
    this.initialConfigurationData = {}

    _.bindAll(this, ['beforeEach', 'afterEach', 'runTest'])
  }

  beforeEach() {
    const self = this
    return run(function* () {
      self.checkpoint = null
      self.deviceIds.splice(0)
      self.initialConfigurationData = {}
    })
  }

  // Does not currently work to create initial checkpoint in beforeEach
  // because of how Device Token is setup, so runTest creates an initial
  // checkpoint and then runs test using db.run
  // Also allows device authentication in setup of test without relying
  // on run order of tests
  runTest(test) {
    const self = this
    return run(function* (knex) {
      // Authenticates device and user from auth setup
      const { server, auth } = self
      const { user, type, status = 'approved' } = auth

      const { id: deviceStatusId } = yield knex('DeviceStatus')
        .where({ token: status })
        .first('id')
      assert.isOk(deviceStatusId)

      const clientToken = yield server.post('/api/auth')
        .send({ name: user, password: 'test07', clientName: 'Mocha/Chai' })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)
          return res.body.access
        })

      const deviceId = yield server
        .get('/api/device')
        .query({
          size: 1,
          type,
          deviceStatusId
        })
        .set('Authorization', `Bearer ${clientToken}`)
        .then((res) => {
          assert.equal(res.status, 200)

          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 1)
          assert.property(res.body.data[0], 'id')
          return res.body.data[0].id
        })

      // save device id for the following tests
      self.deviceIds.splice(0)
      self.deviceId = deviceId

      self.clientAuth = `Bearer ${clientToken}`
      self.deviceAuth = yield* self.getDeviceAuth(knex, deviceId)
      self.deviceConfigurationData = JSON.parse(self.initialConfigurationData[deviceId])

      self.deviceIds.push(deviceId)

      self.checkpoint = `Device API Device Tests ${new Date()}`
      yield self.server.post(devicePath)
        .set('Authorization', self.deviceAuth)
        .send({ checkpoint: self.checkpoint })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      return yield* test(knex)
    })
  }

  * getDeviceAuth(knex, deviceId) {
    this.deviceIds.push(deviceId)

    const { configurationData } = yield knex('Device')
      .where({ id: deviceId })
      .first('configurationData')

    this.initialConfigurationData[deviceId] = configurationData || null

    const deviceToken = yield* getApiKey(knex, deviceId)
    return `Bearer ${deviceToken}`
  }

  afterEach() {
    const self = this
    return run(function* (knex) {
      // Reset to previous device configuration
      for (const deviceId of self.deviceIds) {
        const configurationData = self.initialConfigurationData[deviceId] || null
        yield knex('Device')
          .where({ id: deviceId })
          .update({ configurationData })
      }

      if (self.checkpoint) {
        yield* deleteTestDataFromCheckpoint(knex, self.checkpoint, self.deviceIds)
      }
    })
  }
}

module.exports = {
  createTestContext,
  getDeviceConfigurationData,
  getLastDeviceOperation,
  getLastDeviceOperationData,
  getLastDeviceOperationId,
  getLastResultId
}
