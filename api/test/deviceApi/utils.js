const _ = require('lodash')
const chai = require('chai')
const supertest = require('supertest')
const { subHours } = require('date-fns')
const { run } = require('../../src/db')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { getResult } = require('../../src/deviceApi/result')
const { queuePurge } = require('../utils/mqUtils')
const {
  deviceTypeToId,
  deviceStatusToId,
  resultCategoryToId,
  resultSourceToId,
  resultTypeToId,
  resultWorkflowStatusToId,
  sampleTypeToId,
} = require('../../src/shared/dictionary')

const { assert } = chai

const devicePath = '/device'

const server = supertest.agent('http://localhost:8080')

async function deleteTestDataFromCheckpoint(knex, checkpoint, deviceIds) {
  const minDeviceLog = await knex('DeviceLog as dl')
    .where('dl.checkpoint', checkpoint)
    .first('dl.id as id')
  if (!minDeviceLog) {
    // if no updates, nothing to delete
    return
  }

  const deviceUpdates = await knex('DeviceLog as dl')
    .where('dl.id', '>=', minDeviceLog.id)
    .whereIn('dl.deviceId', deviceIds)
    .select('dl.id', 'dl.resultId', 'dl.deviceOperationId')

  const deviceLogIds = _.uniq(_.map(deviceUpdates, 'id'))
  const resultIds = _.uniq(_.map(deviceUpdates, 'resultId'))
  const opIds = _.uniq(_.map(deviceUpdates, 'deviceOperationId'))

  await deleteIssues(knex, { resultIds })
  await knex('DeviceLog')
    .whereIn('id', deviceLogIds)
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
    .whereIn('generatedResultId', resultIds)
    .delete()
  await knex('ResultGeneratedResult')
    .whereIn('sourceResultId', resultIds)
    .delete()
  await knex('ResultFileReference')
    .whereIn('resultId', resultIds)
    .delete()
  await knex('ResultTag').del()
  await knex('Tag').del()
  await knex('Result')
    .whereIn('id', resultIds)
    .delete()
  await knex('DeviceOperation')
    .whereIn('id', opIds)
    .delete()
}

async function deleteDeviceAndTestData(knex, apiKeys) {
  const tokens = apiKeys.map(key => key.token)
  const deviceIds = await knex('DeviceApiKey as dak')
    .whereIn('dak.token', tokens)
    .whereNotNull('dak.deviceId')
    .pluck('dak.deviceId')

  const deviceResultIds = await knex('Result')
    .whereIn('deviceId', deviceIds)
    .map(result => result.id)
  const generatedResultIds = await knex('ResultGeneratedResult')
    .whereIn('sourceResultId', deviceResultIds)
    .map(r => r.generatedResultId)
  const resultIds = deviceResultIds.concat(generatedResultIds)

  const opIds = await knex('DeviceOperation')
    .whereIn('deviceId', deviceIds)
    .map(op => op.id)

  const tagIds = await knex('ResultTag')
    .whereIn('resultId', resultIds)
    .pluck('tagId')

  await deleteIssues(knex, { deviceIds, resultIds })
  await knex('ResultTag')
    .whereIn('tagId', tagIds)
    .delete()
  await knex('Tag')
    .whereIn('id', tagIds)
    .delete()
  await knex('DeviceStatusLog')
    .whereIn('deviceId', deviceIds)
    .delete()
  await knex('FactDeviceFlag')
    .whereIn('deviceId', deviceIds)
    .delete()
  await knex('DeviceLog')
    .whereIn('deviceId', deviceIds)
    .orWhereIn('resultId', resultIds)
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
  await knex('ResultFileReference')
    .whereIn('resultId', resultIds)
    .delete()
  await knex('Result')
    .whereIn('id', resultIds)
    .delete()
  await knex('DeviceOperation')
    .whereIn('id', opIds)
    .delete()
  await knex('DeviceApiKey')
    .whereIn('deviceId', deviceIds)
    .update({ deviceId: null })
  await knex('Device')
    .whereIn('id', deviceIds)
    .delete()
  await knex('DeviceApiKey')
    .whereIn('token', tokens)
    .delete()
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
  const fileReferenceIds = await knex('WebhookMessage')
    .whereIn('id', webhookMessageIds)
    .select('fileReferenceId')

  await knex('Notification')
    .whereIn('id', notificationIds)
    .delete()
  await knex('AlertMessage')
    .whereIn('id', alertMessageIds)
    .delete()
  await knex('EmailMessage')
    .whereIn('id', emailMessageIds)
    .delete()
  await knex('SmsMessage')
    .whereIn('id', smsMessageIds)
    .delete()
  await webhookMessageQ.orWhereIn('id', webhookMessageIds).delete()
  await knex('ResultFileReference')
    .whereIn('fileReferenceId', fileReferenceIds)
    .delete()
  await knex('FileReference')
    .whereIn('id', fileReferenceIds)
    .delete()
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
  await knex('Issue')
    .whereIn('id', issueIds)
    .delete()
}

async function getDeviceConfigurationData(knex, deviceId) {
  const { configurationData } = await knex('Device')
    .where({ id: deviceId })
    .first('configurationData')

  return JSON.parse(configurationData || null)
}

async function getDeviceFromApiKey(knex, apiKey) {
  return knex('Device as d')
    .innerJoin('DeviceApiKey as dak', 'd.id', 'dak.deviceId')
    .where('dak.token', apiKey.token)
    .first('d.*')
}

async function getSiteFromDeviceId(knex, deviceId) {
  const site = await knex('Device as d')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .where('d.id', deviceId)
    .first('s.*')
  return site
}

async function getLastDeviceOperation(knex, deviceId) {
  const lastOpId = await getLastDeviceOperationId(knex, deviceId)
  if (!lastOpId) {
    return null
  }

  const op = await knex('DeviceOperation')
    .where({ id: lastOpId })
    .first('id', 'startedOn', 'endedOn', 'data')
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

async function getLastResult(knex, deviceId) {
  const resultId = await getLastResultId(knex, deviceId)
  return getResult(knex, resultId)
}

async function createSite(knex, { partner, user, site }) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partner })
    .first('id')
  // find geography for current user
  const { id: geographyId } = await knex('Geography as g')
    .join('JobContext as jc', 'g.id', 'jc.geographyId')
    .join('Job as j', 'jc.jobId', 'j.id')
    .join('Person as p', 'j.personId', 'p.id')
    .join('User as u', 'p.userId', 'u.id')
    .where('p.lastPartnerId', partnerId)
    .andWhere('u.name', user)
    .first('g.id')

  // create new site
  const [siteId] = await knex('Site').insert({
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
  { siteId, type = 'DaktariVirology', status = 'approved', baseConfig = {} }
) {
  const now = new Date()

  const { geographyId, partnerId } = await knex('Site as s')
    .where({ id: siteId })
    .first()

  const [deviceId] = await knex('Device').insert({
    partnerId,
    geographyId,
    siteId,
    deviceTypeId: await deviceTypeToId(type),
    deviceStatusId: await deviceStatusToId(status),
    configurationData: JSON.stringify(baseConfig),
    name: 'Test Device',
    shortName: 'Test Device',
    lastSeenOn: now,
  })

  await knex('FactDeviceFlag').insert({ deviceId, updatedOn: now })

  return deviceId
}

async function createResult(
  knex,
  { deviceId, userId, sampleType = 'DBS', assayName = 'DaktariHivVl' }
) {
  const now = new Date()

  const { siteId, partnerId, geographyId } = await knex('Device as d')
    .where({ id: deviceId })
    .first()

  const [sampleId] = await knex('Sample').insert({
    externalId: `NEW SAMPLE ${new Date().getTime()}`,
    collectedOn: now,
    sampleTypeId: await sampleTypeToId(sampleType),
    originSiteId: siteId,
  })

  const { id: daktariHivVlId } = await knex('Assay')
    .where({ externalId: assayName })
    .first()

  const [resultId] = await knex('Result').insert({
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
    externalId: `NEW RESULT ${new Date().getTime()}`,
    assayId: daktariHivVlId,
    partnerId,
    geographyId,
    siteId,
    deviceId,
    resultWorkflowStatusId: await resultWorkflowStatusToId('OK'),
    resultSourceId: await resultSourceToId('Generated'),
    resultTypeId: await resultTypeToId('Patient'),
    sampleId,
    resultCategory1: await resultCategoryToId('NoResult'),
    resultData: JSON.stringify({}),
    startedOn: subHours(now, 2),
    endedOn: now,
  })

  return resultId
}

function createTestContext(server, auth) {
  return new DeviceApiTestContext(server, auth)
}

class DeviceApiTestContext {
  constructor(
    server,
    {
      user,
      password,
      partner,
      type,
      site,
      status = 'approved',
      baseConfig = {},
    }
  ) {
    this.server = server
    this.user = user
    this.password = password
    this.partner = partner
    this.type = type
    this.site = site
    this.status = status
    this.baseConfig = baseConfig
    this.now = new Date()

    this.siteIds = []
    this.deviceIds = []
    this.apiKeysWithoutDevice = []
    _.bindAll(this, [
      'runTest',
      'afterEach',
      'createDeviceWithResult',
      'createDeviceApiKey',
    ])
  }

  createDeviceWithResult() {
    return run(async knex => {
      const { userId } = await knex('User')
        .where({ name: this.user })
        .first('id as userId')

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

      const deviceId = await createDevice(knex, {
        siteId,
        type: this.type,
        status: this.status,
        baseConfig: this.baseConfig,
      })
      this.deviceId = deviceId
      this.deviceIds.push(deviceId)

      await createResult(knex, {
        deviceId,
        userId,
      })

      await knex('DeviceApiKey')
        .where({ token: apiKey.token })
        .update({ deviceId })

      this.checkpoint = `Device API Device Tests ${new Date()}`
      await this.server
        .post(devicePath)
        .set('Authorization', this.deviceAuth)
        .send({ checkpoint: this.checkpoint })
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
    })
  }

  createDeviceApiKey() {
    return run(async knex => {
      const clientToken = await this.requestClientToken({
        user: this.user,
        password: this.password,
      })
      const apiKey = await this.createApiKey(knex, this.site)
      // save device id for the following tests
      this.apiKey = apiKey
      this.clientAuth = `Bearer ${clientToken}`
      this.deviceAuth = `Bearer ${apiKey.token}`
    })
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

  async createApiKey(knex, siteName = null) {
    const { id: partnerId } = await knex('Partner')
      .where({ name: this.partner })
      .first('id')

    const { userId } = await knex('User')
      .where({ name: this.user })
      .first('id as userId')

    let site = null
    if (siteName != null) {
      site = await knex('Site')
        .where({ externalId: siteName, partnerId })
        .first('id', 'partnerId', 'geographyId')
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
    })
    this.apiKeysWithoutDevice.push(apiKey)
    return apiKey
  }

  createSites(siteNames) {
    return run(async knex => {
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
    })
  }

  runTest(test) {
    return run(async knex => test(knex))
  }

  afterEach() {
    return run(async knex => {
      // Wait for queue to be idle so all created data
      // that will be created can be cleared
      await queuePurge()

      if (this.checkpoint) {
        await deleteTestDataFromCheckpoint(
          knex,
          this.checkpoint,
          this.deviceIds
        )
      }

      if (this.apiKeysWithoutDevice.length > 0) {
        await deleteDeviceAndTestData(knex, this.apiKeysWithoutDevice)
      }

      if (this.siteIds.length > 0) {
        await knex('Sample')
          .whereIn('originSiteId', this.siteIds)
          .delete()
        await knex('InventoryItem')
          .whereIn('siteId', this.siteIds)
          .delete()
        await knex('Site')
          .whereIn('id', this.siteIds)
          .delete()
      }
    })
  }
}

async function postToDeviceApi({
  authHeader,
  payload,
  expectedStatusCode,
  expectedResponseBody,
}) {
  return server
    .post('/device')
    .set('Authorization', authHeader)
    .send(payload)
    .then(res => {
      if (expectedStatusCode) {
        assert.equal(res.statusCode, expectedStatusCode)
      } else if (
        !expectedResponseBody &&
        !_.inRange(res.statusCode, 200, 300)
      ) {
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
  const [maxDeviceId] = await knex
    .from('Device')
    .orderBy('id', 'desc')
    .limit(1)
    .select('id')
    .pluck('id')
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
    .from('Device')
    .where('id', '>', deviceId)
    .orderBy('id', 'asc')
    .select(
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
      'configurationData'
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
  deleteDeviceAndTestData,
  postToDeviceApi,
  getMaxDeviceId,
  getDeviceType,
  getDevicesWithIdLargerThan,
}
