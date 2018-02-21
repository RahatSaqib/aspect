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

const { assert } = chai

async function deleteDeviceSiteDataAndRefreshTokens(knex, apiKeys, clientId) {
  const tokens = apiKeys.map(key => key.token)
  const siteIds = await knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .whereIn('dak.token', tokens)
    .pluck('d.siteId')
    .union(function() {
      this.from('DeviceApiKey as dak')
        .whereNotNull('dak.siteId')
        .whereIn('dak.token', tokens)
        .pluck('dak.siteId')
    })
  const deviceIds = await knex('DeviceApiKey as dak')
    .whereIn('dak.token', tokens)
    .pluck('dak.deviceId')
    .union(function() {
      this.from('Device')
        .whereIn('siteId', siteIds)
        .pluck('id as deviceId')
    })

  const inventoryItemIds = await knex('InventoryItem as ii')
    .whereIn('ii.siteId', siteIds)
    .distinct('ii.id')
    .pluck('ii.id')

  await knex('InventoryLog')
    .whereIn('inventoryItemId', inventoryItemIds)
    .delete()

  await knex('InventoryItem')
    .whereIn('id', inventoryItemIds)
    .delete()

  await knex('DeviceApiKey')
    .whereIn('token', tokens)
    .orWhereIn('deviceId', deviceIds)
    .orWhereIn('siteId', siteIds)
    .delete()

  const resultIds = await knex('Result')
    .whereIn('deviceId', deviceIds)
    .pluck('id')
    .union(function() {
      this.from('ResultGeneratedResult as rgr')
        .innerJoin('Result as r', 'rgr.sourceResultId', 'r.id')
        .whereIn('r.deviceId', deviceIds)
        .pluck('generatedResultId as id')
    })

  const opIds = await knex('DeviceOperation')
    .whereIn('deviceId', deviceIds)
    .map(op => op.id)

  await knex('DeviceStatusLog')
    .whereIn('deviceId', deviceIds)
    .delete()
  await knex('DeviceLog')
    .whereIn('deviceId', deviceIds)
    .orWhereIn('resultId', resultIds)
    .delete()

  await knex('DeviceSiteHistory')
    .whereIn('deviceId', deviceIds)
    .delete()
  await knex('FactResultCountDevice')
    .whereIn('deviceId', deviceIds)
    .delete()
  await knex('FactDeviceFlag')
    .whereIn('deviceId', deviceIds)
    .delete()
  await knex('DeviceSiteHistory')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('InventoryLog')
    .whereIn('resultId', resultIds)
    .delete()
  await knex('ResultQualityControlLog')
    .whereIn('resultId', resultIds)
    .delete()
  await knex('ResultWorkflowLog')
    .whereIn('resultId', resultIds)
    .delete()
  await knex('ResultGeneratedResult')
    .whereIn('sourceResultId', resultIds)
    .orWhereIn('generatedResultId', resultIds)
    .delete()
  await knex('Result')
    .whereIn('id', resultIds)
    .delete()

  await knex('DeviceOperation')
    .whereIn('id', opIds)
    .delete()

  await knex('Device')
    .whereIn('siteId', siteIds)
    .orWhereIn('deviceId', deviceIds)
    .delete()
  await knex('Sample')
    .whereIn('originSiteId', siteIds)
    .delete()

  await knex('Site')
    .whereIn('id', siteIds)
    .delete()

  await knex('RefreshToken')
    .where({ clientId })
    .delete()
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
    this.apiKeys = []
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
    return run(async () => this.requestNewApiKey())
  }

  requestNewApiKey() {
    return run(async () => {
      const clientAccessToken = await this.requestClientToken()
      this.apiKey = await this.requestNewDeviceApiKey(clientAccessToken)
      this.apiKeys.push(this.apiKey)
      this.deviceAuth = `Bearer ${this.apiKey}`
    })
  }

  beforeRegisterAndSetDevice() {
    return run(async () => this.registerAndSetDevice())
  }

  registerAndSetDevice() {
    return run(async knex => {
      this.apiKey = await this.registerDevice()
      this.apiKeys.push(this.apiKey)
      this.deviceAuth = `Bearer ${this.apiKey}`
      this.device = await getDeviceFromApiKey(knex, { token: this.apiKey })
      assert.isNotEmpty(
        this.device,
        `Cannot find device created from ${this.apiKey}`
      )
      this.site = await getSiteFromDeviceId(knex, this.device.id)
      assert.isNotEmpty(
        this.site,
        `Cannot find site linked to device ${this.device.id}`
      )
    })
  }

  async registerDevice() {
    const clientAccessToken = await this.requestClientToken()
    const deviceApiKey = await this.requestNewDeviceApiKey(clientAccessToken)
    await this.sendInitialDeviceConfiguration(deviceApiKey)
    return deviceApiKey
  }

  requestClientToken() {
    return this.server
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

  requestNewDeviceApiKey(clientAccessToken) {
    return this.server
      .post('/api/demo/device/api-key')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .then(res => {
        assert.equal(res.statusCode, 200)
        assert.isOk(res.body.token)
        return res.body.token
      })
      .catch(assert.fail)
  }

  async sendInitialDeviceConfiguration(deviceApiKey) {
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
    await this.server
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
    return run(async () => this.runTestInline(test))
  }

  runTestInline(test) {
    return run(async knex => {
      const now = new Date()
      this.now = now
      const testResult = await test(knex)
      return testResult
    })
  }

  afterCleanUp() {
    return run(async () => this.cleanUp())
  }

  async cleanUp() {
    return run(async knex => {
      if (!_.isEmpty(this.apiKeys)) {
        await deleteDeviceSiteDataAndRefreshTokens(
          knex,
          _.map(this.apiKeys, apiKey => ({ token: apiKey })),
          this.clientId
        )
      }
    })
  }
}

module.exports = {
  createGxConnectTestContext,
}
