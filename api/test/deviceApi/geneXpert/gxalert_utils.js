const _ = require('lodash')
const chai = require('chai')
const { getDeviceFromApiKey } = require('../utils')
const { run } = require('../../../src/db')
const { waitAsyncComplete } = require('../../utils/generatorFunctionUtils')
const { randomToken } = require('../../../src/deviceApi/apiKey')

const { assert } = chai

async function deleteGxAlertDeviceDataAndRefreshTokens(
  knex,
  apiKeys,
  clientId
) {
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

  await knex('FactResultCountDevice')
    .whereIn('deviceId', deviceIds)
    .delete()

  await knex('Device')
    .whereIn('id', deviceIds)
    .delete()

  await knex('RefreshToken')
    .where({ clientId })
    .delete()
}

async function deleteGeneXpertDeviceSiteDataAndRefreshTokens(
  knex,
  gxAlertDeviceIds
) {
  const deviceAndSiteIds = await knex('Device as d')
    .whereRaw(
      `JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") IN (${gxAlertDeviceIds.join(
        ','
      )})`
    )
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
      status: null,
      type: {
        id: 'CepheidGeneXpert',
      },
      site: null,
      checkpoint: null,
      log: null,
      configuration: null,
      operation: null,
      result: null,
    }
    _.bindAll(this, [
      'beforeCreateGxAlertApiKey',
      'useGxAlertDeviceId',
      'runTest',
      'getLastResult',
      'getCurrentGeneXpertDevice',
      'afterCleanUp',
      'cleanUp',
    ])
  }

  beforeCreateGxAlertApiKey() {
    return run(async () => this.createGxAlertApiKey())
  }

  createGxAlertApiKey() {
    return run(async knex => {
      const gxAlertDeviceType = await knex
        .from('DeviceType')
        .where('externalId', 'GxAlert')
        .first()
      const partnerOne = await knex
        .from('Partner')
        .where('name', 'Partner One')
        .first()
      const usGeography = await knex
        .from('Country as c')
        .join('Geography as g', 'g.countryId', 'c.id')
        .where('c.abbreviation', 'US')
        .andWhere('g.stateId', null)
        .andWhere('g.lgaId', null)
        .first('g.*')
      const approvedDeviceStatus = await knex
        .from('DeviceStatus')
        .where('token', 'approved')
        .first()
      const now = new Date()
      const [deviceId] = await knex('Device').insert({
        partnerId: partnerOne.id,
        geographyId: usGeography.id,
        deviceTypeId: gxAlertDeviceType.id,
        deviceStatusId: approvedDeviceStatus.id,
        name: this.basicDevicePayload.name,
        shortName: this.basicDevicePayload.name,
        configurationData: '{}',
        putInService: now,
        lastSeenOn: now,
        createdOn: now,
        updatedOn: now,
      })
      const adminUser = await knex
        .from('User')
        .where('name', 'admin')
        .first()
      this.apiKey = randomToken()
      await knex('DeviceApiKey').insert({
        token: this.apiKey,
        revoked: 0,
        partnerId: partnerOne.id,
        geographyId: usGeography.id,
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
    if (
      this.basicDevicePayload.configuration.data.gxAlertDeviceId !==
      gxAlertDeviceId
    ) {
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
        await deleteGeneXpertDeviceSiteDataAndRefreshTokens(
          knex,
          this.gxAlertDeviceIds
        )
      }
      if (!_.isEmpty(this.apiKeys)) {
        await deleteGxAlertDeviceDataAndRefreshTokens(
          knex,
          this.apiKeys,
          this.clientId
        )
      }
    })
  }

  getLastResult() {
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
        .whereRaw(
          `JSON_EXTRACT(sourceDevice.configurationData, "$.gxAlertDeviceId") IN (${this.gxAlertDeviceIds.join(
            ','
          )})`
        )
        .andWhere('d.id', this.device.id)
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
    })
  }

  getCurrentGeneXpertDevice() {
    return run(async knex => {
      const device = await knex
        .from('Device')
        .whereRaw(
          `JSON_EXTRACT(configurationData, "$.gxAlertDeviceId") = ${_.last(
            this.gxAlertDeviceIds
          )}`
        )
        .first(
          'id',
          'partnerId',
          'geographyId',
          'siteId',
          'deviceTypeId',
          'deviceStatusId',
          'name',
          'shortName',
          'macAddress',
          'serial',
          'hostId',
          'culture',
          'timezone',
          'configurationData',
          'lastSeenOn',
          'lastPingOn'
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
