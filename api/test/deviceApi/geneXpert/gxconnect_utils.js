/*
This is a copy of utils.js but removes the concept of checkpoint from the device
  context

GxConnect is unaware of checkpoints

GxConnect also has the requirement to be able to  register itself as a device
*/
const _ = require('lodash')
const chai = require('chai')
const { getSiteFromDeviceId, getDeviceFromApiKey } = require('../utils')
const { waitForIdle } = require('../../utils/mqUtils')
const { run } = require('../../../src/db')

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

  await knex('FactResultsDevice')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('FactResultsDeviceByAssay')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('FactResultsDeviceByCategory1')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('FactResultsDeviceByCategory1And2')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('FactDeviceFlag')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('DeviceSiteHistory')
    .whereIn('deviceId', deviceIds)
    .delete()

  const issueIds = await knex('Issue')
    .whereIn('deviceId', deviceIds)
    .pluck('id')

  await knex('IssueEvent')
  .whereIn('issueId', issueIds)
  .orWhere(function() {
    if (resultIds != null && resultIds.length > 0) {
      this.whereRaw(
        `JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`
      )
    }
  })
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
    countryCode,
    deviceName,
    hostId,
    macAddress,
    deviceSerialNumber,
    adminUsername,
    adminPassword,
  }
) {
  return new GxConnectApiTestContext(server, {
    countryCode,
    deviceName,
    hostId,
    macAddress,
    deviceSerialNumber,
    adminUsername,
    adminPassword,
  })
}

class GxConnectApiTestContext {
  constructor(
    server,
    {
      countryCode,
      deviceName,
      hostId,
      macAddress,
      deviceSerialNumber,
      adminUsername,
      adminPassword,
    }
  ) {
    this.server = server
    this.countryCode = countryCode
    this.deviceName = deviceName
    this.hostId = hostId
    this.macAddress = macAddress
    this.deviceSerialNumber = deviceSerialNumber
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
        data: { macAddress, hostId, deviceSerialNumber },
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
      'getLastResult',
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
    if (this.countryCode) {
      configurationData.country = this.countryCode
    }
    if (this.deviceSerialNumber) {
      configurationData.deviceSerialNumber = this.deviceSerialNumber
    }
    await this.server
      .post('/device')
      .set('Authorization', `Bearer ${deviceApiKey}`)
      .send(
        _.merge({}, this.basicDevicePayload, {
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
      await waitForIdle()
      if (!_.isEmpty(this.apiKeys)) {
        await deleteDeviceSiteDataAndRefreshTokens(
          knex,
          _.map(this.apiKeys, apiKey => ({ token: apiKey })),
          this.clientId
        )
      }
    })
  }

  getLastResult() {
    return run(async knex => {
      const resultDetails = await knex('DeviceLog as dl')
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
        .where('dl.deviceId', this.device.id)
        .orderBy('dl.id', 'desc')
        .first(
          'r.id',
          'r.externalId',
          'r.deviceId',
          'r.siteId',
          'r.geographyId',
          'r.latitude',
          'r.longitude',
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
          'r.errorCode',
          'r.updatedOn',
          'r.createdOn'
        )
      if (resultDetails) {
        resultDetails.patientData = JSON.parse(resultDetails.patientData)
        resultDetails.resultData = JSON.parse(resultDetails.resultData)
      }
      return resultDetails
    })
  }
}

module.exports = {
  createGxConnectTestContext,
}
