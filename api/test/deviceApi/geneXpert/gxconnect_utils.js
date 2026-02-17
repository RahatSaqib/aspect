/*
This is a copy of utils.js but removes the concept of checkpoint from the device
  context

GxConnect also has the requirement to be able to  register itself as a device
*/
const _ = require('lodash')
const chai = require('chai')
const { addMinutes, subDays, format: dateFormat } = require('date-fns')
const { getSiteFromDeviceId, getDeviceFromApiKey } = require('../utils')
const { waitForIdle } = require('../../utils/mqUtils')
const { run, knex } = require('../../../src/db')

const {
  allResultCategoryToId,
  resultSourceToId,
  resultTypeToId,
  sampleTypeToId,
} = require('../../../src/shared/dictionary')
const { insertSite } = require('../../../src/site/common/db')

const { assert } = chai

async function deleteDeviceSiteDataAndRefreshTokens(knex, apiKeys, clientId) {
  const tokens = apiKeys.map(key => key.token)
  const siteIds = await knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .whereIn('dak.token', tokens)
    .pluck('d.siteId')
    .union(function () {
      this.from('DeviceApiKey as dak').whereNotNull('dak.siteId').whereIn('dak.token', tokens).pluck('dak.siteId')
    })
  const deviceIds = await knex('DeviceApiKey as dak')
    .whereIn('dak.token', tokens)
    .pluck('dak.deviceId')
    .union(function () {
      this.from('Device').whereIn('siteId', siteIds).pluck('id as deviceId')
    })

  const inventoryItemIds = await knex('InventoryItem as ii')
    .whereIn('ii.siteId', siteIds)
    .distinct('ii.id')
    .pluck('ii.id')

  await knex('InventoryLog').whereIn('inventoryItemId', inventoryItemIds).delete()

  await knex('InventoryItem').whereIn('id', inventoryItemIds).delete()

  const deviceApiKeyIds = await knex('DeviceApiKey')
    .whereIn('token', tokens)
    .orWhereIn('deviceId', deviceIds)
    .orWhereIn('siteId', siteIds)
    .pluck('id')

  await knex('Device').whereIn('deviceApiKeyId', deviceApiKeyIds).update({ deviceApiKeyId: null })

  await knex('DeviceApiKey').whereIn('id', deviceApiKeyIds).delete()

  const resultIds = await knex('Result').whereIn('deviceId', deviceIds).pluck('id')

  const opIds = await knex('DeviceOperation').whereIn('deviceApiKeyId', deviceApiKeyIds).pluck('id')
  await knex('EmailMessage').whereIn('resultId', resultIds).delete()
  await knex('ResultDownloadLog').whereIn('resultId', resultIds).delete()
  await knex('ResultStatusLog').whereIn('resultId', resultIds).delete()
  await knex('AlertMessage').whereIn('resultId', resultIds).delete()
  await knex('SmsMessage').whereIn('resultId', resultIds).delete()
  await knex('PushNotificationMessage').whereIn('resultId', resultIds).delete()
  await knex('WebhookMessage').whereIn('resultId', resultIds).delete()
  await knex('DeviceApprovalLog').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceLog').whereIn('deviceApiKeyId', deviceApiKeyIds).delete()
  await knex('DeviceLog').whereIn('resultId', resultIds).delete()
  await knex('FactResultsDevice').whereIn('deviceId', deviceIds).delete()
  await knex('FactResultsDeviceByAssay').whereIn('deviceId', deviceIds).delete()
  await knex('FactResultsDeviceByCategory1').whereIn('deviceId', deviceIds).delete()
  await knex('FactDeviceFlag').whereIn('deviceId', deviceIds).delete()

  const issueIds = await knex('Issue').whereIn('deviceId', deviceIds).pluck('id')

  await knex('IssueEvent')
    .whereIn('issueId', issueIds)
    .orWhere(function () {
      if (resultIds != null && resultIds.length > 0) {
        this.whereRaw(`JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`)
      }
    })
    .delete()

  await knex('InventoryLog').whereIn('resultId', resultIds).delete()

  await knex('ResultQualityControlLog').whereIn('resultId', resultIds).delete()

  await knex('ResultTag').delete()
  await knex('SiteTag').delete()
  await knex('Tag').delete()

  const sitesAndDevices = await knex('Result').whereIn('id', resultIds).select('siteId', 'deviceId')
  await knex('Result').whereIn('id', resultIds).delete()

  await knex('FactInventoryConsumptionRate')
    .whereIn('siteId', siteIds)
    .orWhereIn(
      'siteId',
      _.map(sitesAndDevices, elem => elem.siteId)
    )
  await knex('DeviceOperation').whereIn('id', opIds).delete()

  await knex('Notification').whereIn('issueId', issueIds).delete()
  await knex('Issue').whereIn('id', issueIds).delete()

  const devices = await knex('Device')
    .whereIn('siteId', siteIds)
    .orWhereIn('id', deviceIds)
    .orWhereIn(
      'id',
      _.map(sitesAndDevices, elem => elem.deviceId)
    )
    .select('id')

  const deviceIdsToRemove = _.map(devices, d => d.id)

  await knex('FactDeviceModulesCount').whereIn('deviceId', deviceIdsToRemove).delete()

  await knex('Device').whereIn('id', deviceIdsToRemove).delete()

  await knex('Sample').whereIn('originSiteId', siteIds).delete()

  await knex('FactInventoryConsumptionRate', siteIds).delete()
  await knex('SiteTag').whereIn('siteId', siteIds).delete()
  await knex('InventoryLog').whereIn('siteId', siteIds).delete()
  await knex('Site')
    .whereIn('id', siteIds)
    .orWhereIn(
      'id',
      _.map(sitesAndDevices, elem => elem.siteId)
    )
    .delete()

  await knex('RefreshToken').where({ clientId }).delete()
}

function createGxConnectTestContext(
  server,
  { countryCode, deviceName, hostId, macAddress, deviceSerialNumber, adminUsername, adminPassword }
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
    { countryCode, deviceName, hostId, macAddress, deviceSerialNumber, adminUsername, adminPassword }
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
      approval: null,
      type: {
        id: 'CepheidGeneXpert',
      },
      site: null,
      log: null,
      includeDeviceConfiguration: false,
      configuration: {
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
      'getAllResults',
      'afterCleanUp',
      'cleanUp',
      'createResultForThisDevice',
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
      assert.isNotEmpty(this.device, `Cannot find device created from ${this.apiKey}`)
      this.site = await getSiteFromDeviceId(knex, this.device.id)
      assert.isNotEmpty(this.site, `Cannot find site linked to device ${this.device.id}`)

      const [{ id: deviceApprovalIdApproved }] = [await knex('DeviceApproval').where({ token: 'approved' }).first()]
      if (deviceApprovalIdApproved !== this.device.deviceApprovalId) {
        await knex('Device').update('deviceApprovalId', deviceApprovalIdApproved).where('id', this.device.id)
        this.device.deviceApprovalId = deviceApprovalIdApproved
      }
    })
  }

  async registerDevice() {
    const clientAccessToken = await this.requestClientToken()
    const deviceApiKey = await this.requestNewDeviceApiKey(clientAccessToken)

    const deviceApiKeyRecord = await knex('DeviceApiKey').where({ token: deviceApiKey }).first()

    const { id: geographyId } = await knex('Geography as g')
      .join('JobContext as jc', 'g.id', 'jc.geographyId')
      .join('Person as p', 'jc.personId', 'p.id')
      .join('User as u', 'p.userId', 'u.id')
      .where('p.lastPartnerId', deviceApiKeyRecord.partnerId)
      .andWhere('u.name', this.adminUsername)
      .first('g.id')

    const [siteId] = await insertSite(knex, {
      name: this.deviceName,
      shortName: this.deviceName,
      externalId: `gxconnect-${this.deviceName}-${Date.now()}`,
      partnerId: deviceApiKeyRecord.partnerId,
      geographyId,
    })

    const { id: deviceTypeId } = await knex('DeviceType').where('externalId', 'CepheidGeneXpert').first('id')
    const [deviceId] = await knex('Device').insert({
      partnerId: deviceApiKeyRecord.partnerId,
      siteId,
      name: this.deviceName,
      shortName: this.deviceName,
      deviceTypeId,
      serial: this.deviceSerialNumber,
      macAddress: this.macAddress,
      timezone: 'Eastern Standard Time',
    })
    await knex('DeviceApiKey').where('id', deviceApiKeyRecord.id).update({ deviceId, siteId, geographyId })
    await knex('Device').where('id', deviceId).update({ deviceApiKeyId: deviceApiKeyRecord.id })

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
      .post('/api/deviceApiKey/api-key')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .then(res => {
        assert.equal(res.statusCode, 200, 'Post Api-key')
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
    await waitForIdle(2000)
    if (!_.isEmpty(this.apiKeys)) {
      await deleteDeviceSiteDataAndRefreshTokens(
        knex,
        _.map(this.apiKeys, apiKey => ({ token: apiKey })),
        this.clientId
      )
    }
  }

  async createResultForThisDevice({ assayExternalId = 'GxMtbRif', resultDetails = {} }) {
    const daysToSubtract = Math.ceil(Math.random() ** 4 * 60)
    const randomDate = subDays(new Date(), daysToSubtract)
    const randomNumber = Math.floor(Math.random() * 10000000000)

    const { partnerId } = this.device
    const sampleTypeId = await sampleTypeToId('assayTypeMtbRif')
    const sample = {
      externalId: `${dateFormat(randomDate, 'yy')}/${randomNumber}`,
      collectedOn: subDays(new Date(), daysToSubtract),
      sampleTypeId,
      originSiteId: this.site.id,
    }
    const assay = await knex('Assay').where('externalId', assayExternalId).first()
    ;[sample.id] = await knex('Sample').insert(sample)

    const resultSourceDiagnosticDeviceId = await resultSourceToId('DiagnosticDevice')
    const resultCategories = await allResultCategoryToId()
    const resultTypePatientId = await resultTypeToId('Patient')
    const [resultId] = await knex('Result').insert(
      _.merge(
        {
          externalId: `someresult-${randomNumber}`,
          assayId: assay.id,
          partnerId,
          siteId: this.site.id,
          reportableSiteId: this.site.id,
          deviceId: this.device.id,
          longitude: this.site.longitude,
          latitude: this.site.latitude,
          resultSourceId: resultSourceDiagnosticDeviceId,
          resultTypeId: resultTypePatientId,
          sampleId: sample.id,
          resultCategory1: resultCategories.Unknown,
          resultCategory2: resultCategories.Unknown,
          resultData: '{}',
          formData: '{}',
          patientData: '{}',
          startedOn: randomDate,
          endedOn: addMinutes(randomDate, 100),
          createdOn: addMinutes(randomDate, 120),
          updatedOn: addMinutes(randomDate, 180),
          createdBy: this.device.createdBy,
          updatedBy: this.device.createdBy,
        },
        resultDetails
      )
    )
    return resultId
  }

  getLastResult() {
    return run(async knex => {
      const resultDetails = await knex('DeviceLog as dl')
        .join('Result as r', 'dl.resultId', 'r.id')
        .join('Device as d', 'r.deviceId', 'd.id')
        .leftJoin('Site as si', 'r.siteId', 'si.id')
        .leftJoin('Assay as a', 'r.assayId', 'a.id')
        .leftJoin('ResultSource as rs', 'r.resultSourceId', 'rs.id')
        .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
        .leftJoin('Sample as s', 'r.sampleId', 's.id')
        .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
        .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
        .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
        .where('d.id', this.device.id)
        .orderBy('dl.id', 'desc')
        .first(
          'r.id',
          'r.externalId',
          'r.deviceId',
          'r.siteId',
          'si.geographyId',
          'r.latitude',
          'r.longitude',
          'a.externalId as assay',
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

  async removeResults(resultIds) {
    return knex('Result').whereIn('id', resultIds).delete()
  }

  async getAllResults() {
    return knex('Result as r').where('r.deviceId', this.device.id).select()
  }
}

module.exports = {
  createGxConnectTestContext,
}
