const _ = require('lodash')
const { run } = require('../../../src/db')
const { waitAsyncComplete } = require('../../utils/generatorFunctionUtils')
const { randomToken } = require('../../../src/deviceApi/apiKey')

async function deleteGxAlertDeviceDataAndRefreshTokens(knex, apiKeys, clientId) {
  const deviceIds = await knex('DeviceApiKey as dak').whereIn('dak.token', apiKeys).pluck('dak.deviceId')
  await knex('DeviceApiKey').whereIn('token', apiKeys).orWhereIn('deviceId', deviceIds).delete()

  const opIds = await knex('DeviceOperation').whereIn('deviceId', deviceIds).pluck('id')

  await knex('DeviceApprovalLog').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceLog').whereIn('deviceId', deviceIds).delete()

  await knex('DeviceOperation').whereIn('id', opIds).delete()

  await knex('FactDeviceFlag').whereIn('deviceId', deviceIds).delete()

  await knex('FactResultsDevice').whereIn('deviceId', deviceIds).delete()

  await knex('FactResultsDeviceByAssay').whereIn('deviceId', deviceIds).delete()

  await knex('FactResultsDeviceByCategory1').whereIn('deviceId', deviceIds).delete()

  await knex('AlertMessage').whereIn('deviceId', deviceIds).delete()

  await knex('Device').whereIn('id', deviceIds).delete()

  await knex('RefreshToken').where({ clientId }).delete()
}

async function deleteGeneXpertDeviceSiteDataAndRefreshTokens(knex, gxAlertDeviceIds) {
  const deviceAndSiteIds = await knex('Device as d')
    .whereRaw(`JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") IN (${gxAlertDeviceIds.join(',')})`)
    .select('d.id', 'd.siteId')
  const deviceIds = _.uniq(_.map(deviceAndSiteIds, deviceAndSiteId => deviceAndSiteId.id))
  const siteIds = _.uniq(_.map(deviceAndSiteIds, deviceAndSiteId => deviceAndSiteId.siteId))

  const inventoryItemIds = await knex('InventoryItem as ii')
    .whereIn('ii.siteId', siteIds)
    .distinct('ii.id')
    .pluck('ii.id')

  const inventoryLogIds = await knex('InventoryLog')
    .whereIn('inventoryItemId', inventoryItemIds)
    .distinct('id')
    .pluck('id')

  await knex('InventoryTransfer').whereIn('incomeInventoryLogId', inventoryLogIds).delete()
  await knex('InventoryLog').whereIn('inventoryItemId', inventoryItemIds).delete()

  await knex('InventoryItem').whereIn('id', inventoryItemIds).delete()

  const resultIds = await knex('Result').whereIn('deviceId', deviceIds).pluck('id')

  const opIds = await knex('DeviceOperation').whereIn('deviceId', deviceIds).pluck('id')

  const issueIds = await knex('Issue').whereIn('deviceId', deviceIds).pluck('id')

  await knex('DeviceApprovalLog').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceLog').whereIn('deviceId', deviceIds).orWhereIn('resultId', resultIds).delete()
  await knex('DeviceMaintenance').whereIn('deviceId', deviceIds).delete()
  await knex('FactResultsDevice').whereIn('deviceId', deviceIds).delete()
  await knex('FactResultsDeviceByAssay').whereIn('deviceId', deviceIds).delete()
  await knex('FactResultsDeviceByCategory1').whereIn('deviceId', deviceIds).delete()
  await knex('FactDeviceFlag').whereIn('deviceId', deviceIds).delete()

  await knex('IssueEvent')
    .whereIn('issueId', issueIds)
    .orWhere(function () {
      if (resultIds != null && resultIds.length > 0) {
        this.whereRaw(`JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`)
      }
    })
    .delete()

  await knex('Issue').whereIn('deviceId', deviceIds).delete()

  await knex('Issue').whereIn('resultId', resultIds).delete()

  await knex('InventoryLog').whereIn('resultId', resultIds).delete()

  await knex('ResultQualityControlLog').whereIn('resultId', resultIds).delete()

  await knex('AlertMessage').whereIn('resultId', resultIds).delete()

  await knex('EmailMessage').whereIn('resultId', resultIds).delete()

  await knex('SmsMessage').whereIn('resultId', resultIds).delete()

  await knex('ResultFollowUp').whereIn('resultId', resultIds).delete()

  await knex('ResultTag').delete()
  await knex('SiteTag').delete()
  await knex('Tag').delete()

  await knex('Result').whereIn('id', resultIds).delete()

  await knex('DeviceOperation').whereIn('id', opIds).delete()

  await knex('DeviceApiKey').whereIn('siteId', siteIds).orWhereIn('deviceId', deviceIds).delete()

  const devices = await knex('Device').whereIn('siteId', siteIds).orWhereIn('id', deviceIds).select('id')
  const deviceIdsToRemove = _.map(devices, d => d.id)

  await knex('FactDeviceModulesCount').whereIn('deviceId', deviceIdsToRemove).delete()

  await knex('Device').whereIn('id', deviceIdsToRemove).delete()

  await knex('Sample').whereIn('originSiteId', siteIds).delete()

  await knex('FactInventoryConsumptionRate').whereIn('siteId', siteIds).delete()
  await knex('JobContext').whereIn('siteId', siteIds).delete()
  await knex('InventoryLog').whereIn('siteId', siteIds).delete()
  await knex('Site').whereIn('id', siteIds).delete()

  await knex('DeviceMaintenanceStatusLog').whereIn('deviceId', deviceIds).delete()
}

function createGxAlertTestContext(server) {
  return new GxAlertApiTestContext(server)
}

class GxAlertApiTestContext {
  constructor(server) {
    this.server = server
    this.clientId = `${Math.floor(Math.random() * 800000000) + 100000000}`
    this.apiKeys = []
    this.gxAlertDeviceIds = []
    this.gxAlertDeviceName = 'GxAlert Cloud'
    this.basicDevicePayload = {
      name: this.gxAlertDeviceName,
      serial: null,
      approval: null,
      type: {
        id: 'CepheidGeneXpert',
      },
      site: null,
      log: null,
      configuration: {
        data: {
          country: 'US',
        },
      },
      operation: null,
      result: null,
    }
    _.bindAll(this, [
      'beforeCreateGxAlertApiKey',
      'useGxAlertDeviceId',
      'runTest',
      'getLastResult',
      'getResult',
      'getCurrentGeneXpertDevice',
      'afterCleanUp',
      'cleanUp',
    ])
  }

  beforeCreateGxAlertApiKey(apiKeyDetails) {
    return run(async () => this.createGxAlertApiKey(apiKeyDetails))
  }

  createGxAlertApiKey(apiKeyDetails = {}) {
    const { countryAbbreviation = 'US', partnerName = 'Partner One' } = apiKeyDetails
    return run(async knex => {
      const gxAlertDeviceType = await knex.from('DeviceType').where('externalId', 'GxAlert').first()
      const partner = await knex.from('Partner').where('name', partnerName).first()
      const geography = await knex
        .from('Country as c')
        .join('Geography as g', 'g.countryId', 'c.id')
        .where('c.abbreviation', countryAbbreviation)
        .andWhere('g.stateId', null)
        .andWhere('g.lgaId', null)
        .first('g.*')
      const approvedDeviceApproval = await knex.from('DeviceApproval').where('token', 'approved').first()

      const now = new Date()
      const [deviceId] = await knex('Device').insert({
        partnerId: partner.id,
        deviceTypeId: gxAlertDeviceType.id,
        deviceApprovalId: approvedDeviceApproval.id,
        moduleBayCapacity: 0,
        name: this.basicDevicePayload.name,
        shortName: this.basicDevicePayload.name,
        configurationData: '{}',
        putInService: now,
        lastSeenOn: now,
        createdOn: now,
        updatedOn: now,
      })
      await knex('FactDeviceFlag').insert({ deviceId, updatedOn: now })
      const adminUser = await knex.from('User').where('name', 'admin').first()
      this.apiKey = randomToken()
      await knex('DeviceApiKey').insert({
        token: this.apiKey,
        revoked: 0,
        partnerId: partner.id,
        geographyId: geography.id,
        createdOn: now,
        createdBy: adminUser.id,
        updatedOn: now,
        updatedBy: adminUser.id,
        deviceId,
      })
      this.apiKeys.push(this.apiKey)
      this.deviceAuth = `Bearer ${this.apiKey}`
      this.device = await knex('Device').where({ id: deviceId }).first()
    })
  }

  useGxAlertDeviceId(gxAlertDeviceId) {
    if (!this.gxAlertDeviceIds.includes(gxAlertDeviceId)) {
      this.gxAlertDeviceIds.push(gxAlertDeviceId)
    }
    if (this.basicDevicePayload.configuration === null) {
      this.basicDevicePayload.configuration = { data: {} }
    }
    if (this.basicDevicePayload.configuration.data === null) {
      this.basicDevicePayload.configuration.data = {}
    }
    if (this.basicDevicePayload.configuration.data.gxAlertDeviceId !== gxAlertDeviceId) {
      this.basicDevicePayload.configuration.data.gxAlertDeviceId = gxAlertDeviceId
    }
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
      await waitAsyncComplete()
      if (!_.isEmpty(this.gxAlertDeviceIds)) {
        await deleteGeneXpertDeviceSiteDataAndRefreshTokens(knex, this.gxAlertDeviceIds)
      }
      if (!_.isEmpty(this.apiKeys)) {
        await deleteGxAlertDeviceDataAndRefreshTokens(knex, this.apiKeys, this.clientId)
      }
    })
  }

  async getLastResult() {
    if (!this.device || !this.device.id) {
      throw new Error(
        'GxAlertApiTestContext does not have a valid device with an ID. Cannot get the last result from an unknown device.'
      )
    }
    return run(async knex => {
      const resultDetails = await knex('Device as d')
        .join('DeviceLog as dl', 'd.id', 'dl.deviceId')
        .join('Result as r', 'dl.resultId', 'r.id')
        .join('Device as sourceDevice', 'r.deviceId', 'r.deviceId')
        .leftJoin('Site as si', 'r.siteId', 'si.id')
        .leftJoin('Assay as a', 'r.assayId', 'a.id')
        .leftJoin('ResultSource as rs', 'r.resultSourceId', 'rs.id')
        .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
        .leftJoin('Sample as s', 'r.sampleId', 's.id')
        .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
        .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
        .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
        .whereRaw(
          `JSON_EXTRACT(sourceDevice.configurationData, "$.gxAlertDeviceId") IN (${this.gxAlertDeviceIds.join(',')})`
        )
        .andWhere('d.id', this.device.id)
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
          'r.createdOn',
          'r.updatedOn'
        )
      if (resultDetails) {
        resultDetails.patientData = JSON.parse(resultDetails.patientData)
        resultDetails.resultData = JSON.parse(resultDetails.resultData)
      }
      return resultDetails
    })
  }

  getResult(resultId) {
    return run(async knex => {
      const resultDetails = await knex('Result as r')
        .join('Device as sourceDevice', 'r.deviceId', 'r.deviceId')
        .leftJoin('Site as si', 'r.siteId', 'si.id')
        .leftJoin('Assay as a', 'r.assayId', 'a.id')
        .leftJoin('ResultSource as rs', 'r.resultSourceId', 'rs.id')
        .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
        .leftJoin('Sample as s', 'r.sampleId', 's.id')
        .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
        .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
        .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
        .where('r.id', resultId)
        .orderBy('r.id', 'desc')
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
          'r.errorCode'
        )
      if (resultDetails) {
        resultDetails.patientData = JSON.parse(resultDetails.patientData)
        resultDetails.resultData = JSON.parse(resultDetails.resultData)
      }
      return resultDetails
    })
  }

  getCurrentGeneXpertDevice() {
    return run(async knex => {
      const device = await knex
        .from('Device as d')
        .leftJoin('Site as s', 's.id', 'd.siteId')
        .leftJoin('Geography as g', 's.geographyId', 'g.id')
        .leftJoin('Country as c', 'g.countryId', 'c.id')
        .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
        .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
        .whereRaw(`JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") = ${_.last(this.gxAlertDeviceIds)}`)
        .first(
          'd.id',
          'd.partnerId',
          'g.id as geographyId',
          'c.abbreviation as countryAbbreviation',
          's.id as siteId',
          'd.deviceTypeId',
          'd.deviceApprovalId',
          'd.name',
          'd.shortName',
          'd.macAddress',
          'd.serial',
          'd.hostId',
          'd.culture',
          'd.timezone',
          'd.configurationData',
          'd.lastSeenOn',
          'd.lastPingOn',
          'dms.externalId as deviceMaintenanceStatus'
        )
      if (_.isEmpty(device)) {
        return device
      }
      return _.merge({}, device, {
        configurationData: JSON.parse(device.configurationData),
      })
    })
  }
}

module.exports = {
  createGxAlertTestContext,
}
