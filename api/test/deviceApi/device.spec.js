const _ = require('lodash')
const chai = require('chai')
const subDays = require('date-fns/subDays')
const {
  createTestContext,
  getDeviceConfigurationData,
  getLastDeviceOperation,
  getLastDeviceOperationData,
  getLastDeviceOperationId,
  getDeviceFromApiKey,
} = require('./utils')
const { createMessageContext, waitForIdle } = require('../utils/mqUtils')

const server = require('../utils/testUtils')
const { knex } = require('../../src/db')

const { assert } = chai

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

const context = createTestContext(knex, server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  baseConfig,
})
const { factGenerateDeviceConnectivity } = require('../../src/fact/actions')
const { deviceOffline, deviceOnline } = require('../../src/device/actions')

describe('Device API routes', () => {
  const devicePath = '/device'

  beforeEach(async () => {
    await context.createDeviceWithResult()
  })
  afterEach(context.afterEach)

  describe('configuration', () => {
    it('should add and merge device configuration', async () => {
      const { deviceAuth, deviceId } = context
      let res
      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { a: 'b' } } })
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const config1 = await getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(config1, _.assign({}, baseConfig, { a: 'b' }))

      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { b: 3 } } })
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const config2 = await getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(config2, _.assign({}, baseConfig, { a: 'b', b: 3 }))

      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          configuration: { data: { a: 'e', c: 2, d: false, e: { f: 'g' } } },
        })

      assert.equal(res.status, 200)

      const config3 = await getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(
        config3,
        _.assign({}, baseConfig, {
          a: 'e',
          b: 3,
          c: 2,
          d: false,
          e: { f: 'g' },
        })
      )

      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { e: { f: 'h' } } } })

      assert.equal(res.status, 200)

      const config4 = await getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(
        config4,
        _.assign({}, baseConfig, {
          a: 'e',
          b: 3,
          c: 2,
          d: false,
          e: { f: 'h' },
        })
      )
    })
  })

  describe('operation', () => {
    it('should add and return device operation', async () => {
      const { deviceId, deviceAuth } = context
      let res
      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ operation: { data: { a: 'b' } } })
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const op1 = await getLastDeviceOperationData(knex, deviceId)
      assert.deepEqual(op1, { a: 'b' })

      let previousOpId = null
      let currentOpId = await getLastDeviceOperationId(knex, deviceId)

      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          operation: {
            startedOn: '2013-12-01',
            endedOn: '2013-12-01T01:30',
            data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
          },
        })
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const op2 = await getLastDeviceOperation(knex, deviceId)
      assert.deepEqual(op2.data, { a: 'b', c: 2, d: false, e: { f: 'g' } })
      assert.deepEqual(op2.startedOn, new Date('2013-12-01'))
      assert.deepEqual(op2.endedOn, new Date('2013-12-01T01:30'))

      previousOpId = currentOpId
      currentOpId = await getLastDeviceOperationId(knex, deviceId)

      assert.notEqual(previousOpId, currentOpId)
    })
  })

  describe('add and get device data', () => {
    it('should add and return device data', async () => {
      const { deviceAuth, deviceId } = context
      let res
      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          configuration: { data: { a: 'b' } },
          operation: { data: { a: 'b' } },
        })

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const config1 = await getDeviceConfigurationData(knex, deviceId)
      const op1 = await getLastDeviceOperationData(knex, deviceId)
      assert.deepEqual(config1, _.assign({}, baseConfig, { a: 'b' }))
      assert.deepEqual(op1, { a: 'b' })

      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          configuration: { data: { a: 'c', c: 2, d: false, e: { f: 'g' } } },
          operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } },
        })
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const config2 = await getDeviceConfigurationData(knex, deviceId)
      const op2 = await getLastDeviceOperationData(knex, deviceId)
      assert.deepEqual(config2, _.assign({}, baseConfig, { a: 'c', c: 2, d: false, e: { f: 'g' } }))
      assert.deepEqual(op2, { a: 'b', c: 2, d: false, e: { f: 'g' } })
    })
  })

  describe('add new device', () => {
    const newDeviceContext = createTestContext(knex, server, {
      user: 'reporter_admin',
      partner: 'Reporter',
      type: 'DaktariInSight',
    })

    beforeEach(async () => {
      await newDeviceContext.createSites(['CHIZ'])
      await newDeviceContext.createDeviceApiKey()
    })
    afterEach(newDeviceContext.afterEach)
    it.skip('should create Device with approvalId and add log to DeviceApprovalLog table', async () => {
      const { apiKey, deviceAuth } = newDeviceContext
      assert.isOk(apiKey)

      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ factGenerateDeviceConnectivity, deviceOffline, deviceOnline })

      // add device
      let res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: { id: 'DaktariInSight' },
          site: { id: 'CHIZ' },
          configuration: {
            data: {
              timezone: 'Hawaiian Standard Time',
            },
          },
        })

      assert.equal(res.status, 200)

      await waitForIdle()

      const newDevice = await getDeviceFromApiKey(knex, apiKey)
      assert.isOk(newDevice)
      assert.isOk(newDevice.name)
      assert.equal(newDevice.timezone, 'Hawaiian Standard Time')
      assert.equal(newDevice.serial, null)

      const deviceLogs = await knex('DeviceApprovalLog as dl').where('dl.deviceId', newDevice.id)
      assert.isOk(deviceLogs)
      assert.propertyVal(newDevice, 'id', deviceLogs[0].deviceId)
      assert.isAtLeast(deviceLogs.length, 1)
      await waitForIdle()

      // ensure device exists on FactDeviceFlag table
      const factDevice = await knex('FactDeviceFlag as fdf')
        .where('fdf.deviceId', newDevice.id)
        .select('fdf.deviceId', 'fdf.offline')

      assert.equal(factDevice.length, 1)
      assert.equal(factDevice[0].offline, 0)

      // update last ping to a date earlier and greater than 7 days and ensure device marked as offline
      const last8Day = subDays(new Date(), 8)

      await knex('Device as d')
        .where('d.id', factDevice[0].deviceId)
        .update({ lastPingOn: last8Day, lastSeenOn: last8Day, createdOn: last8Day })

      // Generate device offline facts and wait for offline action for new device
      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForIdle()

      const [offlineFactDevice] = await knex('FactDeviceFlag as fdf').where('fdf.deviceId', newDevice.id)
      assert.equal(offlineFactDevice.offline, 1)

      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: { id: 'DaktariInSight' },
        })
      assert.equal(res.status, 200)

      await waitForIdle()

      const [onlineFactDevice] = await knex('FactDeviceFlag as fdf').where('fdf.deviceId', newDevice.id)
      assert.equal(onlineFactDevice.offline, 0)
    })

    // TODO: Need to rewrite the test case once the definition of daily capacity is defineds
    it.skip('should assign the Device to the default capacity for the device type and partner', async () => {
      const { apiKey, deviceAuth } = newDeviceContext
      assert.isOk(apiKey)

      // add device
      const res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: { id: 'DaktariInSight' },
          site: { id: 'CHIZ' },
        })

      assert.equal(res.status, 200)

      await waitForIdle()

      const newDevice = await getDeviceFromApiKey(knex, apiKey)

      // TODO: Check Here the device capacity according to the definition, still missing at the moment of writing ASP-7458

      // this is the site default timezone
      assert.equal(newDevice.timezone, 'South Africa Standard Time')
    })
    it('should return shortName of 45 characters if shortName is greater than 45 when creating a device', async () => {
      const { apiKey, deviceAuth } = newDeviceContext
      assert.isOk(apiKey)

      // add device
      const res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: { id: 'DaktariInSight' },
          site: { id: 'CHIZ' },
          name: 'Chanayethazan 1 GeneXpert, Chanayethazan 2 GeneXpert and Patheingyi 1 GeneXpert',
        })

      assert.equal(res.status, 200)

      await waitForIdle()

      const newDevice = await getDeviceFromApiKey(knex, apiKey)

      assert.lengthOf(newDevice.shortName, 45)
    })
  })

  describe('add device Logs', () => {
    it('should create add payload to DeviceLog on Joi failure', async () => {
      const { apiKey, deviceAuth } = context
      assert.isOk(apiKey)

      const [{ count: logLength1 }] = await knex('DeviceLog as dl').count('id as count')
      const res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          site: {
            data: `Device API Test - should create add payload to DeviceLog on Joi failure ${Date.now()}`,
          },
        })

      assert.equal(res.status, 400)

      const [{ count: logLength2 }] = await knex('DeviceLog as dl').count('id as count')

      assert.equal(logLength1 + 1, logLength2)
    })
  })
})
