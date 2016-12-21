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
  const { id: minDeviceLogUpdateId } = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dl.checkpoint', checkpoint)
    .orderBy('dlu.id', 'desc')
    .first('dlu.id as id')

  const deviceUpdates = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dlu.id', '>=', minDeviceLogUpdateId)
    .whereIn('dl.deviceId', deviceIds)
    .select(
      'dlu.id', 'dlu.deviceLogId', 'dlu.resultId',
      'dlu.deviceConfigurationId', 'dlu.deviceOperationId')

  const deviceLogIds = _.uniq(_.map(deviceUpdates, 'deviceLogId'))
  const resultIds = _.uniq(_.map(deviceUpdates, 'resultId'))
  const configIds = _.uniq(_.map(deviceUpdates, 'deviceConfigurationId'))
  const opIds = _.uniq(_.map(deviceUpdates, 'deviceOperationId'))

  for (const deviceId of deviceIds) {
    yield knex('Device')
      .where({ id: deviceId })
      .update({
        deviceConfigurationId: knex('DeviceConfiguration')
          .where({ deviceId })
          .whereNotIn('id', configIds)
          .max('id')
      })
  }

  yield knex('DeviceLogUpdate').whereIn('deviceLogId', deviceLogIds).delete()
  yield knex('DeviceLog').whereIn('id', deviceLogIds).delete()
  yield knex('InventoryLog').whereIn('resultId', resultIds).delete()
  yield knex('Result').whereIn('id', resultIds).delete()
  yield knex('DeviceConfiguration').whereIn('id', configIds).delete()
  yield knex('DeviceOperation').whereIn('id', opIds).delete()
}

function* getLastDeviceConfigurationId(knex, deviceId) {
  const { deviceConfigurationId } = yield knex('Device')
    .where({ id: deviceId })
    .first('deviceConfigurationId')
  return deviceConfigurationId
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

    _.bindAll(this, ['beforeEach', 'afterEach', 'runTest'])
  }

  beforeEach() {
    const self = this
    return run(function* () {
      self.checkpoint = null
      self.deviceIds.splice(0)
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
      const { user, type } = auth

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
        .get(`/api/device?size=1${type ? `&type=${type}` : ''}`)
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
      self.deviceId = deviceId

      const deviceToken = yield* getApiKey(knex, deviceId)
      self.clientAuth = `Bearer ${clientToken}`
      self.deviceAuth = `Bearer ${deviceToken}`

      self.deviceIds.splice(0)
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

  afterEach() {
    const self = this
    return run(function* (knex) {
      if (self.checkpoint) {
        yield* deleteTestDataFromCheckpoint(knex, self.checkpoint, self.deviceIds)
      }
    })
  }
}

module.exports = {
  getApiKey,
  createTestContext,
  deleteTestDataFromCheckpoint,
  getLastDeviceConfigurationId,
  getLastDeviceOperationId,
  getLastResultId
}
