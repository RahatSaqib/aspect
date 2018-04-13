const _ = require('lodash')
const chai = require('chai')
const { run } = require('../../src/db')
const { createMessageQueue } = require('../../src/mq')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')
const { randomToken } = require('../../src/deviceApi/apiKey')

const { assert } = chai

const QUEUE_IDLE_TIME = 250

const devicePath = '/device'

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

  await deleteIssues(knex, { deviceIds })
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
  if (deviceIds != null && deviceIds.length > 0) {
    issueIdQ.orWhereIn('i.deviceId', deviceIds)
  }
  if (resultIds != null && resultIds.length > 0) {
    issueIdQ.orWhereIn('i.resultId', resultIds)
  }

  const issueIds = await issueIdQ.select('i.id').pluck('id')
  const notifications = await knex('Notification')
    .whereIn('issueId', issueIds)
    .select('id', 'alertMessageId', 'emailMessageId', 'smsMessageId')
  const notificationIds = _.map(notifications, 'id')
  const alertMessageIds = _.map(notifications, 'alertMessageId')
  const emailMessageIds = _.map(notifications, 'emailMessageId')
  const smsMessageIds = _.map(notifications, 'smsMessageId')

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
  await knex('IssueEvent')
    .whereIn('issueId', issueIds)
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
  const device = await knex('Device as d')
    .innerJoin('DeviceApiKey as dak', 'd.id', 'dak.deviceId')
    .where('dak.token', apiKey.token)
    .first('d.*')
  return device
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
  const result = await knex('DeviceLog as dl')
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

    _.bindAll(this, [
      'beforeEach',
      'afterEach',
      'runTest',
      'queueConnect',
      'createMessageContext',
      'waitForAction',
    ])
  }

  beforeEach() {
    return run(async () => {
      this.checkpoint = null
      this.deviceIds.splice(0)
      this.initialConfigurationData = {}
      this.apiKeysWithoutDevice.splice(0)
    })
  }

  // Does not currently work to create initial checkpoint in beforeEach
  // because of how Device Token is setup, so runTest creates an initial
  // checkpoint and then runs test using db.run
  // Also allows device authentication in setup of test without relying
  // on run order of tests
  runTest(test) {
    return run(async knex => {
      this.deviceIds.splice(0)
      this.apiKeysWithoutDevice.splice(0)

      // Authenticates device and user from auth setup
      const { server, auth } = this
      const { user, type, status = 'approved' } = auth
      const now = new Date()
      this.now = now
      const { userId } = await knex('User')
        .where({ name: user })
        .first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      this.userId = userId

      const clientToken = await server
        .post('/api/auth')
        .send({ name: user, password: 'test07', clientName: 'Mocha/Chai' })
        .then(res => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)
          return res.body.access
        })
      const dataConstraints = await getConstraints({ name: user })

      const device = await knex('Device as d')
        .innerJoin('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
        .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
        .innerJoin('DeviceStatus as ds', 'ds.id', 'd.deviceStatusId')
        .modify(addConstraints, dataConstraints, { device: 'd' })
        .where(
          Object.assign(
            {
              'ds.token': status,
              'dak.revoked': 0,
            },
            type ? { 'dt.name': type } : {}
          )
        )
        .orderBy('d.name')
        .first('dak.token', 'd.id')
      let apiKey = null
      if (device != null) {
        apiKey = { token: device.token }
      } else {
        // if we can't find device, create API Key
        assert.isNotOk(
          auth.status,
          `Cannot find device with status ${auth.status}`
        )
        assert.isOk(auth.partner, 'Must specify partner')
        const partner = await knex('Partner')
          .where({ name: auth.partner })
          .first('id')
        assert.isOk(partner, `Cannot find partner ${auth.partner}`)
        this.partnerId = partner.id
        apiKey = await this.createApiKey(knex, auth.site || null)
      }
      assert.isOk(apiKey)

      // save device id for the following tests
      this.apiKey = apiKey
      this.clientAuth = `Bearer ${clientToken}`
      this.deviceAuth = `Bearer ${apiKey.token}`

      if (device != null) {
        this.deviceId = device.id

        this.deviceIds.push(device.id)
        const { configurationData } = await knex('Device')
          .where({ id: device.id })
          .first('configurationData')

        this.initialConfigurationData[device.id] = configurationData || null
        this.deviceConfigurationData = JSON.parse(
          this.initialConfigurationData[device.id]
        )

        this.checkpoint = `Device API Device Tests ${new Date()}`
        await this.server
          .post(devicePath)
          .set('Authorization', this.deviceAuth)
          .send({ checkpoint: this.checkpoint })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
      }

      return test(knex)
    })
  }

  async createApiKey(knex, siteName = null) {
    let site = null
    if (siteName === null) {
      site = await knex('Site')
        .where({ externalId: siteName, partnerId: this.partnerId })
        .first('id', 'partnerId', 'geographyId')
    }

    if (siteName != null && site == null) {
      assert.isOk(siteName, `Cannot find site ${siteName}`)
    }
    const apiKey = { token: randomToken() }
    await knex('DeviceApiKey').insert({
      token: apiKey.token,
      revoked: 0,
      partnerId: this.partnerId,
      geographyId: site ? site.geographyId : null,
      siteId: site ? site.id : null,
      createdOn: this.now,
      createdBy: this.userId,
      updatedOn: this.now,
      updatedBy: this.userId,
    })
    this.apiKeysWithoutDevice.push(apiKey)
    return apiKey
  }

  async queueConnect() {
    if (this.queue == null) {
      this.queue = await createMessageQueue('aspect_test_device_api')
    }
    return this.queue
  }

  async createMessageContext() {
    const queue = await this.queueConnect()
    return queue.createMessageContext()
  }

  async waitForAction(predicate, timeout = QUEUE_IDLE_TIME) {
    const queue = await this.queueConnect()
    return queue.waitForAction(predicate, timeout)
  }

  async waitForIdle(idleTime = QUEUE_IDLE_TIME) {
    const queue = await this.queueConnect()
    return queue.waitForIdle(idleTime)
  }

  afterEach() {
    return run(async knex => {
      // Wait for queue to be idle so all created data
      // that will be created can be cleared
      await this.waitForIdle()

      // Reset to previous device configuration
      await Promise.all(
        this.deviceIds.map(deviceId => {
          const configurationData =
            this.initialConfigurationData[deviceId] || null
          return knex('Device')
            .where({ id: deviceId })
            .update({ configurationData })
        })
      )

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

      if (this.queue) {
        await this.queue.close()
        this.queue = null
      }
    })
  }
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
}
