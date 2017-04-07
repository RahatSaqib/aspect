const _ = require('lodash')
const chai = require('chai')
const { run } = require('../../src/db')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')
const { randomToken } = require('../../src/deviceApi/apiKey')

const assert = chai.assert

const devicePath = '/device'

function* deleteTestDataFromCheckpoint(knex, checkpoint, deviceIds) {
  const minDeviceLog = yield knex('DeviceLog as dl')
    .where('dl.checkpoint', checkpoint)
    .first('dl.id as id')
  if (!minDeviceLog) {
    // if no updates, nothing to delete
    return
  }

  const deviceUpdates = yield knex('DeviceLog as dl')
    .where('dl.id', '>=', minDeviceLog.id)
    .whereIn('dl.deviceId', deviceIds)
    .select(
      'dl.id', 'dl.resultId', 'dl.deviceOperationId')

  const deviceLogIds = _.uniq(_.map(deviceUpdates, 'id'))
  const resultIds = _.uniq(_.map(deviceUpdates, 'resultId'))
  const opIds = _.uniq(_.map(deviceUpdates, 'deviceOperationId'))

  yield knex('DeviceLog').whereIn('id', deviceLogIds).delete()
  yield knex('InventoryLog').whereIn('resultId', resultIds).delete()
  yield knex('ResultWorkflowLog').whereIn('resultId', resultIds).delete()
  yield knex('Result').whereIn('id', resultIds).delete()
  yield knex('DeviceOperation').whereIn('id', opIds).delete()
}

function* deleteDeviceAndTestData(knex, apiKeys) {
  const tokens = apiKeys.map(key => key.token)
  const deviceIds = yield knex('Device as d')
    .innerJoin('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
    .whereIn('dak.token', tokens)
    .select('d.id')
    .map(device => device.id)

  const resultIds = yield knex('Result')
    .whereIn('deviceId', deviceIds)
    .map(result => result.id)

  const opIds = yield knex('DeviceOperation')
    .whereIn('deviceId', deviceIds)
    .map(op => op.id)

  yield knex('DeviceLog').whereIn('deviceId', deviceIds).delete()
  yield knex('DeviceSiteHistory').whereIn('deviceId', deviceIds).delete()
  yield knex('InventoryLog').whereIn('resultId', resultIds).delete()
  yield knex('ResultWorkflowLog').whereIn('resultId', resultIds).delete()
  yield knex('Result').whereIn('id', resultIds).delete()
  yield knex('DeviceOperation').whereIn('id', opIds).delete()
  yield knex('DeviceApiKey').whereIn('deviceId', deviceIds).update({ deviceId: null })
  yield knex('Device').whereIn('id', deviceIds).delete()
  yield knex('DeviceApiKey').whereIn('token', tokens).delete()
}

function* getDeviceConfigurationData(knex, deviceId) {
  const { configurationData } = yield knex('Device')
    .where({ id: deviceId })
    .first('configurationData')

  return JSON.parse(configurationData || null)
}

function* getDeviceFromApiKey(knex, apiKey) {
  const device = yield knex('Device as d')
    .innerJoin('DeviceApiKey as dak', 'd.id', 'dak.deviceId')
    .where('dak.token', apiKey.token)
    .first('d.*')
  return device
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
  const op = yield knex('DeviceLog as dl')
    .where('dl.deviceId', deviceId)
    .whereNotNull('dl.deviceOperationId')
    .orderBy('dl.id', 'desc')
    .first('dl.deviceOperationId as id')
  return op && op.id
}

function* getLastResultId(knex, deviceId) {
  const result = yield knex('DeviceLog as dl')
    .where('dl.deviceId', deviceId)
    .whereNotNull('dl.resultId')
    .orderBy('dl.id', 'desc')
    .first('dl.resultId')
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
    this.apiKeysWithoutDevice = []

    _.bindAll(this, ['beforeEach', 'afterEach', 'runTest'])
  }

  beforeEach() {
    const self = this
    return run(function* () {
      self.checkpoint = null
      self.deviceIds.splice(0)
      self.initialConfigurationData = {}
      self.apiKeysWithoutDevice.splice(0)
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
      self.deviceIds.splice(0)
      self.apiKeysWithoutDevice.splice(0)

      // Authenticates device and user from auth setup
      const { server, auth } = self
      const { user, type, status = 'approved' } = auth
      const now = new Date()
      self.now = now
      const { userId } = yield knex('User')
        .where({ name: user })
        .first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      self.userId = userId

      const clientToken = yield server.post('/api/auth')
        .send({ name: user, password: 'test07', clientName: 'Mocha/Chai' })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)
          return res.body.access
        })
      const dataConstraints = yield getConstraints({ name: user })

      const device = yield knex('Device as d')
        .innerJoin('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
        .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
        .innerJoin('DeviceStatus as ds', 'ds.id', 'd.deviceStatusId')
        .modify(addConstraints, dataConstraints, { device: 'd' })
        .where(Object.assign({
          'ds.token': status,
          'dak.revoked': 0
        }, type ? { 'dt.name': type } : {}))
        .orderBy('d.name')
        .first('dak.token', 'd.id')
      let apiKey = null
      if (device != null) {
        apiKey = { token: device.token }
      } else {
        // if we can't find device, create API Key
        assert.isNotOk(auth.status, `Cannot find device with status ${auth.status}`)
        assert.isOk(auth.partner, 'Must specify partner')
        const partner = yield knex('Partner')
          .where({ name: auth.partner })
          .first('id')
        assert.isOk(partner, `Cannot find partner ${auth.partner}`)
        self.partnerId = partner.id
        apiKey = yield* self.createApiKey(knex, auth.site || null)
      }
      assert.isOk(apiKey)

      // save device id for the following tests
      self.apiKey = apiKey
      self.clientAuth = `Bearer ${clientToken}`
      self.deviceAuth = `Bearer ${apiKey.token}`

      if (device != null) {
        self.deviceId = device.id

        self.deviceIds.push(device.id)
        const { configurationData } = yield knex('Device')
          .where({ id: device.id })
          .first('configurationData')

        self.initialConfigurationData[device.id] = configurationData || null
        self.deviceConfigurationData = JSON.parse(self.initialConfigurationData[device.id])

        self.checkpoint = `Device API Device Tests ${new Date()}`
        yield self.server.post(devicePath)
          .set('Authorization', self.deviceAuth)
          .send({ checkpoint: self.checkpoint })
          .then((res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
      }

      return yield* test(knex)
    })
  }

  * createApiKey(knex, siteName = null) {
    const site = siteName == null ? null : yield knex('Site')
      .where({ externalId: siteName, partnerId: this.partnerId })
      .first('id', 'partnerId', 'geographyId')
    if (siteName != null && site == null) {
      assert.isOk(siteName, `Cannot find site ${siteName}`)
    }
    const apiKey = { token: randomToken() }
    yield knex('DeviceApiKey').insert({
      token: apiKey.token,
      revoked: 0,
      partnerId: this.partnerId,
      geographyId: site ? site.geographyId : null,
      siteId: site ? site.id : null,
      createdOn: this.now,
      createdBy: this.userId,
      updatedOn: this.now,
      updatedBy: this.userId
    })
    this.apiKeysWithoutDevice.push(apiKey)
    return apiKey
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

      if (self.apiKeysWithoutDevice.length > 0) {
        yield* deleteDeviceAndTestData(knex, self.apiKeysWithoutDevice)
      }
    })
  }
}

module.exports = {
  createTestContext,
  getDeviceConfigurationData,
  getDeviceFromApiKey,
  getLastDeviceOperation,
  getLastDeviceOperationData,
  getLastDeviceOperationId,
  getLastResultId
}
