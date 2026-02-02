const _ = require('lodash')
const chai = require('chai')
const { subHours } = require('date-fns')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { queuePurge } = require('../utils/mqUtils')
const {
  deviceTypeToId,
  deviceApprovalToId,
  resultCategoryToId,
  resultSourceToId,
  resultTypeToId,
  sampleTypeToId,
} = require('../../src/shared/dictionary')
const { insertSite } = require('../../src/site/common/db')

const { assert } = chai

const server = require('../utils/testUtils')

async function deleteDeviceAndTestData(knex, apiKeys) {
  const tokens = apiKeys.map(key => key.token)
  const deviceIds = await knex('DeviceApiKey as dak')
    .whereIn('dak.token', tokens)
    .whereNotNull('dak.deviceId')
    .pluck('dak.deviceId')

  const resultIds = await knex('Result').whereIn('deviceId', deviceIds).pluck('id')

  const opIds = await knex('DeviceOperation').whereIn('deviceId', deviceIds).pluck('id')

  const tagIds = await knex('ResultTag').whereIn('resultId', resultIds).pluck('tagId')

  await deleteIssues(knex, { deviceIds, resultIds })
  await knex('ResultTag').whereIn('tagId', tagIds).delete()
  await knex('Tag').whereIn('id', tagIds).delete()
  await knex('DeviceLog').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceApprovalLog').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceMaintenanceStatusLog').whereIn('deviceId', deviceIds).delete()
  await knex('DeviceMaintenance').whereIn('deviceId', deviceIds).delete()
  await knex('FactDeviceFlag').whereIn('deviceId', deviceIds).delete()
  await knex('InventoryLog').whereIn('resultId', resultIds).delete()
  await knex('ResultQualityControlLog').whereIn('resultId', resultIds).delete()
  await knex('ResultTransferLog').whereIn('resultId', resultIds).delete()
  await knex('SmsMessage').whereIn('resultId', resultIds).delete()
  await knex('ResultFileReference').whereIn('resultId', resultIds).delete()
  const sampleIds = await knex('Result').whereIn('id', resultIds).pluck('sampleId')
  await knex('Result').whereIn('id', resultIds).delete()
  await knex('Sample').whereIn('id', sampleIds).delete()
  await knex('DeviceOperation').whereIn('id', opIds).delete()
  await knex('DeviceApiKey').whereIn('deviceId', deviceIds).update({ deviceId: null })
  await knex('Device').whereIn('id', deviceIds).delete()
  await knex('DeviceApiKey').whereIn('token', tokens).delete()
}

async function deleteIssues(knex, { deviceIds, resultIds }) {
  const issueIdQ = knex('Issue as i')
  const webhookMessageQ = knex('WebhookMessage')
  resultIds = _.without(resultIds, null)

  if (deviceIds != null && deviceIds.length > 0) {
    issueIdQ.orWhereIn('i.deviceId', deviceIds)
    webhookMessageQ.orWhereIn('deviceId', deviceIds)
  }
  if (resultIds != null && resultIds.length > 0) {
    issueIdQ.orWhereIn('i.resultId', resultIds)
    webhookMessageQ.orWhereIn('resultId', resultIds)
  }

  const issueIds = await issueIdQ.select('i.id').pluck('id')
  const notifications = await knex('Notification')
    .whereIn('issueId', issueIds)
    .select('id', 'alertMessageId', 'emailMessageId', 'smsMessageId')
  const notificationIds = _.map(notifications, 'id')
  const alertMessageIds = _.compact(_.map(notifications, 'alertMessageId'))
  const emailMessageIds = _.compact(_.map(notifications, 'emailMessageId'))
  const smsMessageIds = _.compact(_.map(notifications, 'smsMessageId'))
  const webhookMessageIds = _.compact(_.map(notifications, 'webhookMessageId'))
  const fileReferenceIds = await knex('WebhookMessage').whereIn('id', webhookMessageIds).select('fileReferenceId')

  await knex('Notification').whereIn('id', notificationIds).delete()
  await knex('AlertMessage').whereIn('id', alertMessageIds).delete()
  await knex('EmailMessage').whereIn('id', emailMessageIds).delete()
  await knex('SmsMessage').whereIn('id', smsMessageIds).delete()
  await webhookMessageQ.orWhereIn('id', webhookMessageIds).delete()
  await knex('ResultFileReference').whereIn('fileReferenceId', fileReferenceIds).delete()
  await knex('FileReference').whereIn('id', fileReferenceIds).delete()
  await knex('IssueEvent')
    .whereIn('issueId', issueIds)
    .orWhere(function () {
      if (resultIds != null && resultIds.length > 0) {
        this.whereRaw(`JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`)
      }
    })
    .delete()
  await knex('Issue').whereIn('id', issueIds).delete()
}

async function getDeviceConfigurationData(knex, deviceId) {
  const { configurationData } = await knex('Device').where({ id: deviceId }).first('configurationData')

  return JSON.parse(configurationData || null)
}

async function getDeviceFromApiKey(knex, apiKey) {
  return knex('Device as d')
    .innerJoin('DeviceApiKey as dak', 'd.id', 'dak.deviceId')
    .where('dak.token', apiKey.token)
    .first('d.*')
}

async function getSiteFromDeviceId(knex, deviceId) {
  const site = await knex('Device as d').innerJoin('Site as s', 'd.siteId', 's.id').where('d.id', deviceId).first('s.*')
  return site
}

async function getLastDeviceOperation(knex, deviceId) {
  const lastOpId = await getLastDeviceOperationId(knex, deviceId)
  if (!lastOpId) {
    return null
  }

  const op = await knex('DeviceOperation').where({ id: lastOpId }).first('id', 'startedOn', 'endedOn', 'data')
  return Object.assign(op, { data: JSON.parse(op.data || null) })
}

async function getLastDeviceOperationData(knex, deviceId) {
  const op = await getLastDeviceOperation(knex, deviceId)
  return op ? op.data : null
}

async function getLastDeviceOperationId(knex, deviceId) {
  const op = await knex('DeviceLog as dl')
    .where('dl.deviceId', deviceId)
    .whereNotNull('dl.deviceOperationId')
    .orderBy('dl.id', 'desc')
    .first('dl.deviceOperationId as id')
  return op && op.id
}

async function getLastResultId(knex, deviceId) {
  if (!deviceId) {
    throw new Error('Cannot get the last result ID from an unknown device id.')
  }
  const result = await knex('DeviceLog as dl')
    .where('dl.deviceId', deviceId)
    .whereNotNull('dl.resultId')
    .orderBy('dl.id', 'desc')
    .first('dl.resultId')
  return result && result.resultId
}

async function getResult(knex, resultId) {
  const row = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('ResultSource as rsc', 'r.resultSourceId', 'rsc.id')
    .where('r.id', resultId)
    .first(
      'r.externalId as resultExternalId',
      'r.resultData',
      'r.resultDataHash',
      'r.formData',
      'r.patientData',
      'r.oemData',
      'r.startedOn',
      'r.endedOn',
      'r.updatedOn',
      'r.researchId',
      'r.notes',
      'r.senderVersion',
      'r.senderOperator',
      'r.errorCode',
      'r.errorNotes',
      'r.consumableSerial',
      'r.consumableExpirationDate',
      'r.consumableLot',
      'r.instrumentSerial',
      'r.moduleName',
      'r.moduleSerial',
      'r.id as resultId',
      'r.sampleGroup',
      'a.externalId as assayId',
      'r.assayVersion',
      'r.rawData',
      'r.latitude',
      'r.longitude',
      'rt.externalId as resultTypeId',
      'rsc.externalId as resultSourceId',
      'r.sampleRunNumber',
      's.externalId as sampleId',
      's.collectedOn as sampleCollectedOn',
      'sos.externalId as sampleOriginSiteId',
      'st.externalId as sampleTypeId',
      'rc1.externalId as category1Id',
      'rc2.externalId as category2Id'
    )

  if (row == null) {
    // TODO when is this null??
    return null
  }

  const result = { formData: null }

  if (row.resultExternalId != null) {
    result.id = row.resultExternalId
  }

  result.assay = { id: row.assayId }
  if (row.assayVersion != null) {
    result.assay.version = row.assayVersion
  }

  const location = { latitude: row.latitude, longitude: row.longitude }
  if (location.latitude != null || location.longitude != null) {
    result.location = location
  }
  result.type = { id: row.resultTypeId }
  result.source = { id: row.resultSourceId }

  const sample = {}
  if (row.sampleId != null) {
    sample.id = row.sampleId
  }

  if (row.sampleCollectedOn != null) {
    sample.collectedOn = row.sampleCollectedOn
  }
  if (row.sampleTypeId != null) {
    sample.type = { id: row.sampleTypeId }
  }
  if (row.sampleOriginSiteId != null) {
    sample.originSite = { id: row.sampleOriginSiteId }
  }
  if (row.sampleGroup != null) {
    sample.group = row.sampleGroup
  }
  if (row.sampleRunNumber != null) {
    sample.runNumber = row.sampleRunNumber
  }
  if (!_.isEmpty(sample)) {
    result.sample = sample
  }

  const categories = []
  if (row.category1Id != null) {
    categories.push({ id: row.category1Id })
  }
  if (row.category2Id != null) {
    categories.push({ id: row.category2Id })
  }
  if (categories.length > 0) {
    result.category = categories
  }

  result.data = JSON.parse(row.resultData)
  if (row.formData != null) {
    result.formData = JSON.parse(row.formData)
  }

  if (row.startedOn != null) {
    result.startedOn = row.startedOn
  }

  if (row.endedOn != null) {
    result.endedOn = row.endedOn
  }

  const consumable = {
    serial: row.consumableSerial,
    lot: row.consumableLot,
    expirationDate: row.consumableExpirationDate,
  }
  if (consumable.serial != null || consumable.lot != null || consumable.expirationDate != null) {
    result.consumable = [consumable]
  }

  const instrument = { serial: row.instrumentSerial }
  const module = { name: row.moduleName, serial: row.moduleSerial }
  if (module.name != null || module.serial != null) {
    instrument.module = module
  }

  if (instrument.serial != null || instrument.module != null) {
    result.instrument = instrument
  }

  const research = { id: row.researchId }
  if (research.id != null) {
    result.research = research
  }

  if (row.patientData != null) {
    result.patient = JSON.parse(row.patientData)
  }

  if (row.oemData != null) {
    result.oemData = row.oemData
  }

  if (row.rawData != null) {
    result.rawData = row.rawData
  }

  const sender = { version: row.senderVersion, operator: row.senderOperator }
  if (sender.version != null || sender.operator != null) {
    result.sender = sender
  }
  if (row.notes != null) {
    result.notes = row.notes
  }

  const error = { code: row.errorCode, notes: row.errorNotes }
  if (error.code != null || error.notes != null) {
    result.error = error
  }

  return result
}

async function getLastResult(knex, deviceId) {
  const resultId = await getLastResultId(knex, deviceId)
  return getResult(knex, resultId)
}

async function createSite(knex, { partner, user, site }) {
  const { id: partnerId } = await knex('Partner').where({ name: partner }).first('id')
  // find geography for current user
  const { id: geographyId } = await knex('Geography as g')
    .join('JobContext as jc', 'g.id', 'jc.geographyId')
    .join('Person as p', 'jc.personId', 'p.id')
    .join('User as u', 'p.userId', 'u.id')
    .where('p.lastPartnerId', partnerId)
    .andWhere('u.name', user)
    .first('g.id')

  // create new site
  const [siteId] = await insertSite(knex, {
    name: 'Test Site',
    shortName: 'Test Site',
    externalId: site || `Test Site ${new Date().getTime()}`,
    partnerId,
    geographyId,
  })

  return siteId
}

async function createDevice(
  knex,
  { siteId, type = 'DaktariVirology', approval = 'approved', instrumentSerial, baseConfig = {} },
  insertLog = false
) {
  const now = new Date()

  const { partnerId } = await knex('Site as s').where({ id: siteId }).first()
  const partnerData = await knex('Partner').where({ id: partnerId }).first('deviceCapacityFactor')

  const deviceTypeId = await deviceTypeToId(type)

  const [deviceId] = await knex('Device').insert({
    partnerId,
    siteId,
    deviceTypeId,
    deviceApprovalId: await deviceApprovalToId(approval),
    configurationData: JSON.stringify(baseConfig),
    name: 'Test Device',
    shortName: 'Test Device',
    dailyTestCapacity: type === 'CepheidGeneXpert' ? partnerData.deviceCapacityFactor * 4 : null, // for CepheidGeneXpert we are setting module=4
    moduleBayCapacity: type === 'CepheidGeneXpert' ? 4 : 0,
    lastSeenOn: now,
    lastInstrumentSerial: instrumentSerial,
  })

  await knex('FactDeviceFlag').insert({ deviceId, updatedOn: now })
  if (insertLog) {
    await knex('DeviceLog').insert({
      createdOn: now,
      deviceId,
      senderIp: '127.0.0.1',
      source: 'Test Message',
      rawMessage: 'This is a test device',
    })
  }

  return deviceId
}

async function createResult(
  knex,
  {
    /**
     * all values have defaults in DeviceApiTestContext - see
     * either constructor or getResultProps()
     */
    deviceId,
    userId,
    sampleType, // see fallback value in DeviceApiTestContext's constructor
    assayName, // see fallback value in DeviceApiTestContext's constructor
    instrumentSerial, // see fallback value in DeviceApiTestContext's constructor
    externalId,
    resultSourceId,
    resultTypeId,
    resultCategory1,
    resultData,
    startedOn,
    endedOn,
  }
) {
  const now = new Date()
  if (!resultSourceId) resultSourceId = await resultSourceToId('Generated')
  if (!resultTypeId) resultTypeId = await resultTypeToId('Patient')
  if (!resultCategory1) resultCategory1 = await resultCategoryToId('NoResult')
  if (!resultData) resultData = JSON.stringify({})
  if (!startedOn) startedOn = subHours(now, 2)
  if (!endedOn) endedOn = now

  const { siteId, partnerId } = await knex('Device as d').where({ id: deviceId }).first()

  const [sampleId] = await knex('Sample').insert({
    externalId,
    collectedOn: now,
    sampleTypeId: await sampleTypeToId(sampleType),
    originSiteId: siteId,
  })

  const { id: assayId } = await knex('Assay').where({ externalId: assayName }).first()

  const [resultId] = await knex('Result').insert({
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
    externalId,
    assayId,
    partnerId,
    siteId,
    deviceId,
    resultSourceId,
    resultTypeId,
    sampleId,
    resultCategory1,
    resultData,
    startedOn,
    endedOn,
    reportableSiteId: siteId,
    instrumentSerial,
  })
  await knex('DeviceLog').insert({
    deviceId,
    source: 'TEST',
    createdOn: now,
    senderIp: 'TEST',
    resultId,
  })
  return resultId
}

function createTestContext(knex, server, auth) {
  return new DeviceApiTestContext(knex, server, auth)
}

class DeviceApiTestContext {
  constructor(
    knex,
    server,
    {
      user,
      password,
      partner,
      type,
      site,
      approval = 'approved',
      instrumentSerial = 'A-SERIAL-NUMBER-00001',
      baseConfig = {},
      sampleType = 'DBS',
      // TODO: replace to 'GxMtbRif' after getting rid of Daktari in all tests
      assayName = 'DaktariHivVL',
    }
  ) {
    this.knex = knex
    this.server = server
    this.user = user
    this.password = password
    this.partner = partner
    this.type = type
    this.site = site
    this.approval = approval
    this.baseConfig = baseConfig
    this.instrumentSerial = instrumentSerial
    this.sampleType = sampleType
    this.assayName = assayName
    this.now = new Date()
    this.partnerId = null
    this.siteIds = []
    this.deviceIds = []
    this.apiKeysWithoutDevice = []
    _.bindAll(this, ['runTest', 'afterEach', 'createDeviceWithResult', 'createDeviceApiKey'])
  }

  async getResultProps(props) {
    const now = new Date()
    let { externalId, resultSourceId, resultTypeId, resultCategory1, resultData, startedOn, endedOn } = props
    if (!externalId) externalId = `NEW RESULT ${new Date().getTime()}`
    if (!resultSourceId) resultSourceId = await resultSourceToId('Generated')
    if (!resultTypeId) resultTypeId = await resultTypeToId('Patient')
    if (!resultCategory1) resultCategory1 = await resultCategoryToId('NoResult')
    if (!resultData) resultData = JSON.stringify({})
    if (!startedOn) startedOn = subHours(now, 2)
    if (!endedOn) endedOn = now
    return {
      sampleType: this.sampleType,
      assayName: this.assayName,
      externalId,
      resultSourceId,
      resultTypeId,
      resultCategory1,
      resultData,
      startedOn,
      endedOn,
    }
  }

  async createDeviceWithResult(props = {}) {
    const { knex } = this
    const { userId } = await knex('User').where({ name: this.user }).first('id as userId')
    this.userId = userId

    const clientToken = await this.requestClientToken({
      user: this.user,
      password: this.password,
    })
    const apiKey = await this.createApiKey(knex)
    // save device id for the following tests
    this.apiKey = apiKey
    this.clientAuth = `Bearer ${clientToken}`
    this.deviceAuth = `Bearer ${apiKey.token}`

    const siteId = await createSite(knex, {
      partner: this.partner,
      user: this.user,
      site: this.site,
    })
    // create second site for merge results
    const site2Id = await createSite(knex, {
      partner: this.partner,
      user: this.user,
    })
    this.siteIds.push(siteId)
    this.siteIds.push(site2Id)

    const deviceId = await createDevice(
      knex,
      {
        siteId,
        type: this.type,
        approval: this.approval,
        instrumentSerial: this.instrumentSerial,
        baseConfig: this.baseConfig,
      },
      true
    )
    this.deviceId = deviceId
    this.deviceIds.push(deviceId)

    const resultProps = await this.getResultProps(props)
    this.resultId = await createResult(knex, {
      deviceId,
      instrumentSerial: this.instrumentSerial,
      userId,
      ...resultProps,
    })

    await knex('DeviceApiKey').where({ token: apiKey.token }).update({ deviceId })
  }

  async createDeviceApiKey() {
    const { knex } = this
    const clientToken = await this.requestClientToken({
      user: this.user,
      password: this.password,
    })
    const apiKey = await this.createApiKey(knex, this.site)
    // save device id for the following tests
    this.apiKey = apiKey
    this.clientAuth = `Bearer ${clientToken}`
    this.deviceAuth = `Bearer ${apiKey.token}`
  }

  async createDeviceWithApiKey(props = {}) {
    const { knex } = this
    const { userId } = await knex('User').where({ name: this.user }).first('id as userId')
    this.userId = userId

    const clientToken = await this.requestClientToken({
      user: this.user,
      password: this.password,
    })
    const siteId = await createSite(knex, {
      partner: this.partner,
      user: this.user,
      site: this.site,
    })
    // create second site for merge results
    const site2Id = await createSite(knex, {
      partner: this.partner,
      user: this.user,
    })
    this.siteIds.push(siteId)
    this.siteIds.push(site2Id)

    const deviceId = await createDevice(knex, {
      siteId,
      type: this.type,
      approval: this.approval,
      baseConfig: this.baseConfig,
    })
    this.deviceId = deviceId
    this.deviceIds.push(deviceId)
    this.siteId = siteId // device is assigned to this site
    const apiKey = await this.createApiKey(knex, null, deviceId)
    // save device id for the following tests
    this.apiKey = apiKey
    this.clientAuth = `Bearer ${clientToken}`
    this.deviceAuth = `Bearer ${apiKey.token}`

    const resultProps = await this.getResultProps(props)
    this.resultId = await createResult(knex, {
      deviceId,
      userId,
      ...resultProps,
    })

    await knex('DeviceApiKey').where({ token: apiKey.token }).update({ deviceId })
  }

  requestClientToken({ user, password = 'test07' }) {
    return server
      .post('/api/auth')
      .send({
        name: user,
        password,
        clientName: 'Mocha/Chai',
      })
      .then(res => {
        assert.equal(res.status, 200)
        assert.isAbove(res.body.access.length, 100)
        assert.isAbove(res.body.refresh.length, 50)
        assert.isAbove(res.body.clientId.length, 32)
        return res.body.access
      })
  }

  async createApiKey(knex, siteName = null, deviceId = null) {
    const { id: partnerId } = await knex('Partner').where({ name: this.partner }).first('id')
    this.partnerId = partnerId
    const { userId } = await knex('User').where({ name: this.user }).first('id as userId')

    let site = null
    if (siteName != null) {
      site = await knex('Site').where({ externalId: siteName, partnerId }).first('id', 'partnerId', 'geographyId')
      assert.isOk(site, `Cannot find site ${siteName} partner ${this.partner}`)
    }

    const apiKey = { token: randomToken() }
    await knex('DeviceApiKey').insert({
      token: apiKey.token,
      revoked: 0,
      partnerId,
      geographyId: site ? site.geographyId : null,
      siteId: site ? site.id : null,
      createdOn: this.now,
      createdBy: userId,
      updatedOn: this.now,
      updatedBy: userId,
      deviceId,
    })
    this.apiKeysWithoutDevice.push(apiKey)
    return apiKey
  }

  async createSites(siteNames) {
    const { knex } = this
    await Promise.all(
      _.map(siteNames, async siteName => {
        const siteId = await createSite(knex, {
          partner: this.partner,
          user: this.user,
          site: siteName,
        })
        this.siteIds.push(siteId)
      })
    )
  }

  async runTest(test) {
    return test(this.knex)
  }

  async cleanAll() {
    const { knex } = this

    // Wait for queue to be idle so all created data
    // that will be created can be cleared
    await queuePurge()

    if (this.apiKeysWithoutDevice.length > 0) {
      await deleteDeviceAndTestData(knex, this.apiKeysWithoutDevice)
    }

    if (this.siteIds.length > 0) {
      await knex('Sample').whereIn('originSiteId', this.siteIds).delete()
      await knex('InventoryItem').whereIn('siteId', this.siteIds).delete()
      await knex('Site').whereIn('id', this.siteIds).delete()
      this.siteIds = []
    }
  }

  async afterEach() {
    return this.cleanAll()
  }
}

async function postToDeviceApi({ authHeader, payload, expectedStatusCode, expectedResponseBody }) {
  return server
    .post('/device')
    .set('Authorization', authHeader)
    .send(payload)
    .then(res => {
      if (expectedStatusCode) {
        assert.equal(res.statusCode, expectedStatusCode)
      } else if (!expectedResponseBody && !_.inRange(res.statusCode, 200, 300)) {
        assert.fail(
          res.statusCode.toString(),
          '2XX',
          `The post to Aspect device API failed: ${JSON.stringify(res.body)}`
        )
      }
      if (expectedResponseBody !== undefined) {
        assert.deepEqual(res.body, expectedResponseBody)
      }
      return res
    })
    .catch(error => {
      const { actual, expected, message } = error
      assert.fail(actual, expected, message)
    })
}

async function getMaxDeviceId(knex) {
  const [maxDeviceId] = await knex.from('Device').orderBy('id', 'desc').limit(1).pluck('id')
  return maxDeviceId
}

const deviceTypes = {}
async function getDeviceType(externalId, knex) {
  if (!deviceTypes[externalId]) {
    deviceTypes[externalId] = await knex
      .from('DeviceType')
      .where({ externalId })
      .first('id', 'deviceTypeCategoryId', 'externalid', 'name', 'plugin')
  }
  return Promise.resolve(deviceTypes[externalId])
}

async function getDevicesWithIdLargerThan(deviceId, knex) {
  const devices = await knex
    .from('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .where('d.id', '>', deviceId)
    .orderBy('d.id', 'asc')
    .select(
      'd.partnerId',
      'd.siteId',
      'd.deviceTypeId',
      's.geographyId',
      'd.deviceApprovalId',
      'd.name',
      'd.shortName',
      'd.macAddress',
      'd.serial',
      'd.hostId',
      'd.culture',
      'd.timezone',
      'd.configurationData'
    )
  return _.map(devices, device =>
    _.merge({}, device, {
      configurationData: JSON.parse(device.configurationData),
    })
  )
}

module.exports = {
  createTestContext,
  getDeviceConfigurationData,
  getDeviceFromApiKey,
  getSiteFromDeviceId,
  getLastDeviceOperation,
  getLastDeviceOperationData,
  getLastDeviceOperationId,
  getLastResultId,
  getLastResult,
  createSite,
  // createDevice,
  // createResult,
  postToDeviceApi,
  getMaxDeviceId,
  getDeviceType,
  getDevicesWithIdLargerThan,
  getResult,
}
