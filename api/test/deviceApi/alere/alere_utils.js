const _ = require('lodash')
const chai = require('chai')
const { getDeviceFromApiKey } = require('../utils')
const { waitAsyncComplete } = require('../../utils/generatorFunctionUtils')
const { run } = require('../../../src/db')
const { randomToken } = require('../../../src/deviceApi/apiKey')

const { assert } = chai

async function deleteDeviceDataAndRefreshTokens(knex, apiKeys, clientId) {
  const deviceIds = await knex('DeviceApiKey as dak')
    .whereIn('dak.token', apiKeys)
    .pluck('dak.deviceId')
  await knex('DeviceApiKey')
    .whereIn('token', apiKeys)
    .orWhereIn('deviceId', deviceIds)
    .delete()

  const opIds = await knex('DeviceOperation')
    .whereIn('deviceId', deviceIds)
    .map(op => op.id)

  await knex('DeviceStatusLog')
    .whereIn('deviceId', deviceIds)
    .delete()
  await knex('DeviceLog')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('DeviceOperation')
    .whereIn('id', opIds)
    .delete()

  await knex('FactDeviceFlag')
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

  await knex('Device')
    .whereIn('id', deviceIds)
    .delete()

  await knex('RefreshToken')
    .where({ clientId })
    .delete()
}

async function deleteDeviceSiteDataAndRefreshTokens(
  knex,
  alereDeviceSerialNumbers
) {
  const alereDeviceTypes = ['AlereAfinion', 'AlereQ']
  const deviceAndSiteIds = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .whereIn('d.serial', alereDeviceSerialNumbers)
    .andWhere(function() {
      this.whereIn('dt.externalId', alereDeviceTypes)
    })
    .select('d.id', 'd.siteId')
  const deviceIds = _.uniq(
    _.map(deviceAndSiteIds, deviceAndSiteId => deviceAndSiteId.id)
  )
  const siteIds = _.uniq(
    _.map(deviceAndSiteIds, deviceAndSiteId => deviceAndSiteId.siteId)
  )

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

  const issueIds = await knex('Issue')
    .whereIn('deviceId', deviceIds)
    .pluck('id')

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
  await knex('IssueEvent')
    .whereIn('issueId', issueIds)
    .delete()
  await knex('Issue')
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
}

function createTestContext(server) {
  return new DeviceApiTestContext(server)
}

class DeviceApiTestContext {
  constructor(server) {
    this.server = server
    this.clientId = `${Math.floor(Math.random() * 800000000) + 100000000}`
    this.apiKeys = []
    this.alereDeviceSerialNumbers = []
    this.basicDevicePayload = {
      type: {
        id: 'AlereQ',
      },
      result: null,
    }
    _.bindAll(this, [
      'beforeCreateAlereFtpConnectorApiKey',
      'useAlereDeviceSerialNumber',
      'runTest',
      'getLastResult',
      'getResult',
      'getCurrentAlereDevice',
      'afterCleanUp',
      'cleanUp',
    ])
  }

  beforeCreateAlereFtpConnectorApiKey(apiKeyDetails) {
    return run(async () => this.createAlereFtpConnectorApiKey(apiKeyDetails))
  }

  createAlereFtpConnectorApiKey(apiKeyDetails = {}) {
    const {
      countryAbbreviation = 'US',
      partnerName = 'Partner One',
    } = apiKeyDetails
    return run(async knex => {
      const alereFtpConnectorDeviceType = await knex
        .from('DeviceType')
        .where('externalId', 'AlereFtpConnector')
        .first()
      const partner = await knex
        .from('Partner')
        .where('name', partnerName)
        .first()
      const geography = await knex
        .from('Country as c')
        .join('Geography as g', 'g.countryId', 'c.id')
        .where('c.abbreviation', countryAbbreviation)
        .andWhere('g.stateId', null)
        .andWhere('g.lgaId', null)
        .first('g.*')
      const approvedDeviceStatus = await knex
        .from('DeviceStatus')
        .where('token', 'approved')
        .first()
      const now = new Date()
      const [deviceId] = await knex('Device').insert({
        partnerId: partner.id,
        geographyId: geography.id,
        deviceTypeId: alereFtpConnectorDeviceType.id,
        deviceStatusId: approvedDeviceStatus.id,
        name: 'Some Alere FTP Connector',
        shortName: 'Alere FTP',
        configurationData: '{}',
        putInService: now,
        lastSeenOn: now,
        createdOn: now,
        updatedOn: now,
      })
      await knex('FactDeviceFlag').insert({ deviceId, updatedOn: now })
      const adminUser = await knex
        .from('User')
        .where('name', 'admin')
        .first()
      this.apiKey = randomToken()
      await knex('DeviceApiKey').insert({
        token: this.apiKey,
        revoked: 0,
        partnerId: partner.id,
        geographyId: geography.id,
        deviceId,
        createdOn: now,
        createdBy: adminUser.id,
        updatedOn: now,
        updatedBy: adminUser.id,
      })
      this.apiKeys.push(this.apiKey)
      this.deviceAuth = `Bearer ${this.apiKey}`
      this.device = await getDeviceFromApiKey(knex, { token: this.apiKey })
      assert.isNotEmpty(
        this.device,
        `Cannot find device created from ${this.apiKey}`
      )
    })
  }

  useAlereDeviceSerialNumber(alereDeviceSerialNumber) {
    if (!this.alereDeviceSerialNumbers.includes(alereDeviceSerialNumber)) {
      this.alereDeviceSerialNumbers.push(alereDeviceSerialNumber)
    }
    if (this.basicDevicePayload.result === null) {
      this.basicDevicePayload.result = { instrument: {}, data: {} }
    }
    if (this.basicDevicePayload.result.instrument === null) {
      this.basicDevicePayload.result.instrument = {}
    }
    if (this.basicDevicePayload.result.data === null) {
      this.basicDevicePayload.result.data = {}
    }
    if (
      this.basicDevicePayload.result.instrument.serial !==
      alereDeviceSerialNumber
    ) {
      this.basicDevicePayload.result.instrument.serial = alereDeviceSerialNumber
    }
    if (
      this.basicDevicePayload.result.data.deviceSerial !==
      alereDeviceSerialNumber
    ) {
      this.basicDevicePayload.result.data.deviceSerial = alereDeviceSerialNumber
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
      if (!_.isEmpty(this.alereDeviceSerialNumbers)) {
        await deleteDeviceSiteDataAndRefreshTokens(
          knex,
          this.alereDeviceSerialNumbers
        )
      }
      if (!_.isEmpty(this.apiKeys)) {
        await deleteDeviceDataAndRefreshTokens(
          knex,
          this.apiKeys,
          this.clientId
        )
      }
    })
  }

  async getLastResult() {
    if (!this.device || !this.device.id) {
      throw new Error(
        'Alere Ftp Connector Api TestContext does not have a valid device with an ID. Cannot get the last result from an unknown device.'
      )
    }
    return run(async knex => {
      const resultDetails = await knex('Device as d')
        .join('DeviceLog as dl', 'd.id', 'dl.deviceId')
        .join('Result as r', 'dl.resultId', 'r.id')
        .join('Device as sourceDevice', 'r.deviceId', 'r.deviceId')
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
        .andWhere('d.id', this.device.id)
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
        .where('r.id', resultId)
        .orderBy('r.id', 'desc')
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
          'r.errorCode'
        )
      if (resultDetails) {
        resultDetails.patientData = JSON.parse(resultDetails.patientData)
        resultDetails.resultData = JSON.parse(resultDetails.resultData)
      }
      return resultDetails
    })
  }

  getCurrentAlereDevice() {
    return run(async knex => {
      const device = await knex
        .from('Device as d')
        .leftJoin('Site as s', 's.id', 'd.siteId')
        .leftJoin('Geography as g', function() {
          this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
        })
        .leftJoin('Country as c', 'g.countryId', 'c.id')
        .where('d.serial', _.last(this.alereDeviceSerialNumbers))
        .first(
          'd.id',
          'd.partnerId',
          'g.id as geographyId',
          'c.abbreviation as countryAbbreviation',
          's.id as siteId',
          'd.deviceTypeId',
          'd.deviceStatusId',
          'd.name',
          'd.shortName',
          'd.macAddress',
          'd.serial',
          'd.hostId',
          'd.culture',
          'd.timezone',
          'd.configurationData',
          'd.lastSeenOn',
          'd.lastPingOn'
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
  createTestContext,
  deleteDeviceDataAndRefreshTokens,
  deleteDeviceSiteDataAndRefreshTokens,
}
