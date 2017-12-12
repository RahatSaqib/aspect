/*
This is a copy of utils.js but removes the concept of checkpoint from the device
  context

GxConnect is unaware of checkpoints

GxConnect also has the requirement to be able to  register itself as a device

This is a test to see if checkpoint state is a requirement for all remote devices
  connecting to Aspect
*/
const _ = require('lodash')
const chai = require('chai')
const { getSiteFromDeviceId, getDeviceFromApiKey } = require('./utils')
const { run } = require('../../src/db')

const assert = chai.assert

function* deleteDeviceSiteDataAndRefreshTokens(knex, apiKeys, clientId) {
  const tokens = apiKeys.map(key => key.token)
  const siteIds = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .whereIn('dak.token', tokens)
    .pluck('d.siteId')
    .union(function() {
      this.from('DeviceApiKey as dak')
        .whereNotNull('dak.siteId')
        .whereIn('dak.token', tokens)
        .pluck('dak.siteId')
    })
  const deviceIds = yield knex('DeviceApiKey as dak')
    .whereIn('dak.token', tokens)
    .pluck('dak.deviceId')

  const inventoryItemIds = yield knex('InventoryItem as ii')
    .whereIn('ii.siteId', siteIds)
    .distinct('ii.id')
    .pluck('ii.id')

  yield knex('InventoryLog')
    .whereIn('inventoryItemId', inventoryItemIds)
    .delete()

  yield knex('InventoryItem').whereIn('id', inventoryItemIds).delete()

  yield knex('DeviceApiKey').whereIn('token', tokens).delete()

  const deviceResultIds = yield knex('Result')
    .whereIn('deviceId', deviceIds)
    .map(result => result.id)
  const generatedResultIds = yield knex('ResultGeneratedResult')
    .whereIn('sourceResultId', deviceResultIds)
    .map(r => r.generatedResultId)
  const resultIds = deviceResultIds.concat(generatedResultIds)

  const opIds = yield knex('DeviceOperation')
    .whereIn('deviceId', deviceIds)
    .map(op => op.id)

  yield knex('DeviceStatusLog').whereIn('deviceId', deviceIds).delete()
  yield knex('DeviceLog')
    .whereIn('deviceId', deviceIds)
    .orWhereIn('resultId', resultIds)
    .delete()

  yield knex('DeviceSiteHistory').whereIn('deviceId', deviceIds).delete()
  yield knex('InventoryLog').whereIn('resultId', resultIds).delete()
  yield knex('ResultQualityControlLog').whereIn('resultId', resultIds).delete()
  yield knex('ResultWorkflowLog').whereIn('resultId', resultIds).delete()
  yield knex('ResultGeneratedResult')
    .whereIn('sourceResultId', resultIds)
    .orWhereIn('generatedResultId', resultIds)
    .delete()
  yield knex('Result').whereIn('id', resultIds).delete()
  yield knex('DeviceOperation').whereIn('id', opIds).delete()

  yield knex('Device')
    .whereIn('siteId', siteIds)
    .orWhereIn('deviceId', deviceIds)
    .delete()
  yield knex('Site').whereIn('id', siteIds).delete()

  yield knex('RefreshToken').where({ clientId }).delete()
}

function* getLastResult(knex, deviceId) {
  const resultDetails = yield knex('DeviceLog as dl')
    .join('Result as r', 'dl.resultId', 'r.id')
    .leftJoin(
      'ResultWorkflowStatus as rws',
      'r.resultWorkflowStatusId',
      'rws.id'
    )
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('ResultSource as rs', 'r.resultSourceId', 'rs.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where('dl.deviceId', deviceId)
    .orderBy('dl.id', 'desc')
    .first(
      'r.id',
      'r.externalId',
      'r.deviceId',
      'r.siteId',
      'r.geographyId',
      'a.externalId as assay',
      'rws.externalId as resultWorkflowStatus',
      'rs.externalId as resultSource',
      'rt.externalId as resultType',
      'rc1.externalId as resultCategory1',
      'rc2.externalId as resultCategory2',
      's.externalId as sampleId',
      's.collectedOn as sampleCollectedOn',
      's.originSiteId as sampleOriginSiteId',
      'st.externalId as sampleTypeId',
      'r.resultData',
      'r.assayVersion',
      'r.startedOn',
      'r.endedOn',
      'r.consumableSerial',
      'r.consumableExpirationDate',
      'r.consumableLot',
      'r.instrumentSerial',
      'r.moduleName',
      'r.moduleSerial',
      'r.patientData',
      'r.senderVersion',
      'r.senderOperator',
      'r.notes',
      'r.errorCode'
    )
  if (resultDetails) {
    resultDetails.patientData = JSON.parse(resultDetails.patientData)
    resultDetails.resultData = JSON.parse(resultDetails.resultData)
  }
  return resultDetails
}

function createGxConnectTestContext(
  server,
  {
    countryAbbreviation,
    deviceName,
    macAddress,
    instrumentSerialNumbers,
    adminUsername,
    adminPassword,
  }
) {
  return new GxConnectApiTestContext(server, {
    countryAbbreviation,
    deviceName,
    macAddress,
    instrumentSerialNumbers,
    adminUsername,
    adminPassword,
  })
}

class GxConnectApiTestContext {
  constructor(
    server,
    {
      countryAbbreviation,
      deviceName,
      macAddress,
      instrumentSerialNumbers,
      adminUsername,
      adminPassword,
    }
  ) {
    this.server = server
    this.countryAbbreviation = countryAbbreviation
    this.deviceName = deviceName
    this.macAddress = macAddress
    this.instrumentSerialNumbers = instrumentSerialNumbers
    this.adminUsername = adminUsername
    this.adminPassword = adminPassword
    this.clientId = `${Math.floor(Math.random() * 800000000) + 100000000}`
    this.basicDevicePayload = {
      name: deviceName,
      serial: null,
      status: null,
      type: {
        id: 'CepheidGeneXpert',
      },
      site: null,
      checkpoint: null,
      log: null,
      configuration: {
        checkpoint: null,
        data: { macAddress },
      },
      operation: null,
      result: null,
    }
    _.bindAll(this, [
      'beforeRequestNewApiKey',
      'requestNewApiKey',
      'beforeRegisterAndSetDevice',
      'registerAndSetDevice',
      'runTest',
      'afterCleanUp',
      'cleanUp',
    ])
  }

  beforeRequestNewApiKey() {
    const self = this
    return run(function*() {
      return yield* self.requestNewApiKey()
    })
  }

  *requestNewApiKey() {
    const self = this
    return yield run(function*() {
      const clientAccessToken = yield* self.requestClientToken()
      self.apiKey = yield* self.requestNewDeviceApiKey(clientAccessToken)
      self.deviceAuth = `Bearer ${self.apiKey}`
    })
  }

  beforeRegisterAndSetDevice() {
    const self = this
    return run(function*() {
      return yield* self.registerAndSetDevice()
    })
  }

  *registerAndSetDevice() {
    const self = this
    return yield run(function*(knex) {
      self.apiKey = yield* self.registerDevice()
      self.deviceAuth = `Bearer ${self.apiKey}`
      self.device = yield* getDeviceFromApiKey(knex, { token: self.apiKey })
      assert.isNotEmpty(
        self.device,
        `Cannot find device created from ${self.apiKey}`
      )
      self.site = yield* getSiteFromDeviceId(knex, self.device.id)
      assert.isNotEmpty(
        self.site,
        `Cannot find site linked to device ${self.device.id}`
      )
    })
  }

  *registerDevice() {
    const clientAccessToken = yield* this.requestClientToken()
    const deviceApiKey = yield* this.requestNewDeviceApiKey(clientAccessToken)
    yield* this.sendInitialDeviceConfiguration(deviceApiKey)
    return deviceApiKey
  }

  *requestClientToken() {
    return yield this.server
      .post('/api/auth')
      .send({
        name: this.adminUsername,
        password: this.adminPassword,
        clientName: 'gx_connect',
        clientId: this.clientId,
      })
      .then(res => {
        assert.equal(res.status, 200)
        assert.isAbove(res.body.access.length, 100)
        assert.isAbove(res.body.refresh.length, 50)
        return res.body.access
      })
      .catch(assert.fail)
  }

  *requestNewDeviceApiKey(clientAccessToken) {
    return yield this.server
      .post('/api/demo/device/api-key')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .then(res => {
        assert.equal(res.statusCode, 200)
        assert.isOk(res.body.token)
        return res.body.token
      })
      .catch(assert.fail)
  }

  *sendInitialDeviceConfiguration(deviceApiKey) {
    const configurationData = {}
    if (this.macAddress) {
      configurationData.macAddress = this.macAddress
    }
    if (this.countryAbbreviation) {
      configurationData.country = this.countryAbbreviation
    }
    if (this.instrumentSerialNumbers) {
      configurationData.instrumentSerialNumbers = this.instrumentSerialNumbers
    }
    yield this.server
      .post('/device')
      .set('Authorization', `Bearer ${deviceApiKey}`)
      .send(
        _.merge(this.basicDevicePayload, {
          configuration: {
            checkpoint: null,
            data: configurationData,
          },
        })
      )
      .then(res => {
        assert.equal(res.statusCode, 200)
      })
      .catch(assert.fail)
  }

  runTest(test) {
    const self = this
    return run(function*() {
      return yield* self.runTestInline(test)
    })
  }

  *runTestInline(test) {
    const self = this
    return yield run(function*(knex) {
      const now = new Date()
      self.now = now
      return yield* test(knex)
    })
  }

  afterCleanUp() {
    const self = this
    return run(function*() {
      return yield* self.cleanUp()
    })
  }

  *cleanUp() {
    const self = this
    return yield run(function*(knex) {
      if (!_.isEmpty(self.apiKey)) {
        yield* deleteDeviceSiteDataAndRefreshTokens(
          knex,
          [{ token: self.apiKey }],
          self.clientId
        )
      }
    })
  }
}

module.exports = {
  createGxConnectTestContext,
  getLastResult,
}
