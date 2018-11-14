const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const {
  createTestContext,
  getDeviceConfigurationData,
  getLastDeviceOperation,
  getLastDeviceOperationData,
  getLastDeviceOperationId,
  getDeviceFromApiKey,
} = require('./utils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

const context = createTestContext(server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  baseConfig,
})
const { factGenerateDeviceConnectivity } = require('../../src/fact/actions')
const { deviceOffline, deviceOnline } = require('../../src/device/actions')

describe('Device API routes', () => {
  const devicePath = '/device'

  const { runTest } = context

  beforeEach(async () => {
    await context.createDeviceWithResult()
  })
  afterEach(context.afterEach)

  describe('configuration', () => {
    const deviceConfigurationPath = '/device/configuration'

    it('should add and merge device configuration', () =>
      runTest(async knex => {
        const { deviceAuth, deviceId } = context

        await server
          .post(deviceConfigurationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { a: 'b' } })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
        const config1 = await getDeviceConfigurationData(knex, deviceId)
        assert.deepEqual(config1, _.assign({}, baseConfig, { a: 'b' }))

        await server
          .post(deviceConfigurationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { b: 3 } })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
        const config2 = await getDeviceConfigurationData(knex, deviceId)
        assert.deepEqual(config2, _.assign({}, baseConfig, { a: 'b', b: 3 }))

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            configuration: { data: { a: 'e', c: 2, d: false, e: { f: 'g' } } },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
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

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ configuration: { data: { e: { f: 'h' } } } })
          .then(res => {
            assert.equal(res.status, 200)
          })
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
      }))
  })

  describe('operation', () => {
    const deviceOperationPath = '/device/operation'

    it('should add and return device operation', () =>
      runTest(async knex => {
        const { deviceId, deviceAuth } = context

        await server
          .post(deviceOperationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { a: 'b' } })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const op1 = await getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual(op1, { a: 'b' })

        let previousOpId = null
        let currentOpId = await getLastDeviceOperationId(knex, deviceId)

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            operation: {
              startedOn: '2013-12-01',
              endedOn: '2013-12-01T01:30',
              data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const op2 = await getLastDeviceOperation(knex, deviceId)
        assert.deepEqual(op2.data, { a: 'b', c: 2, d: false, e: { f: 'g' } })
        assert.deepEqual(op2.startedOn, new Date('2013-12-01'))
        assert.deepEqual(op2.endedOn, new Date('2013-12-01T01:30'))

        previousOpId = currentOpId
        currentOpId = await getLastDeviceOperationId(knex, deviceId)

        assert.notEqual(previousOpId, currentOpId)
      }))
  })

  describe('add and get device data', () => {
    it('should add and return device data', () =>
      runTest(async knex => {
        const { deviceAuth, deviceId } = context

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.status.id, 'approved')
          })

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: '124j',
            configuration: { data: { a: 'b' } },
            operation: { data: { a: 'b' } },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const config1 = await getDeviceConfigurationData(knex, deviceId)
        const op1 = await getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual(config1, _.assign({}, baseConfig, { a: 'b' }))
        assert.deepEqual(op1, { a: 'b' })

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'checkpoint')
            assert.equal(res.body.checkpoint, '124j')
            assert.typeOf(res.body.configuration, 'Object')
            assert.deepEqual(res.body.configuration.data, config1)
            assert.typeOf(res.body.operation, 'Object')
            assert.deepEqual(res.body.operation.data, op1)
          })

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'checkpoint')
            assert.equal(res.body.checkpoint, '124j')
          })

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: '12313',
            configuration: { data: { a: 'c', c: 2, d: false, e: { f: 'g' } } },
            operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const config2 = await getDeviceConfigurationData(knex, deviceId)
        const op2 = await getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual(
          config2,
          _.assign({}, baseConfig, { a: 'c', c: 2, d: false, e: { f: 'g' } })
        )
        assert.deepEqual(op2, { a: 'b', c: 2, d: false, e: { f: 'g' } })

        await server
          .get(`${devicePath}?checkpoint=12313`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.configuration, 'Object')
            assert.deepEqual(res.body.configuration.data, config2)
            assert.typeOf(res.body.operation, 'Object')
            assert.deepEqual(res.body.operation.data, op2)
          })
      }))
  })

  describe('get result count', () => {
    it('should return result count from device', () =>
      runTest(async knex => {
        const deviceListPath = '/api/device'
        const { apiKey, deviceId, clientAuth } = context
        const last30Day = subDays(new Date(), 30)
        const last60Day = subDays(last30Day, 30)
        assert.isOk(apiKey)

        const totalResultsLastMonth = await knex('Result as r')
          .whereBetween('r.endedOn', [last60Day, last30Day])
          .where({ deviceId })
          .countDistinct('r.id as total')

        const totalResultsThisMonth = await knex('Result as r')
          .where({ deviceId })
          .andWhere('r.endedOn', '>=', last30Day)
          .countDistinct('r.id as total')

        // get total count of results
        await server
          .get(`${deviceListPath}?size=100`)
          .set('Authorization', clientAuth)
          .then(res => {
            assert.equal(res.status, 200)
            const device = _.find(
              res.body.data,
              device => device.id === deviceId
            )
            assert.equal(device.lastMonth, totalResultsLastMonth[0].total)
            assert.equal(device.thisMonth, totalResultsThisMonth[0].total)
          })
      }))
  })

  describe('add new device', () => {
    const newDeviceContext = createTestContext(server, {
      user: 'reporter_admin',
      partner: 'Reporter',
      type: 'DaktariInSight',
    })
    const { runTest } = newDeviceContext

    beforeEach(async () => {
      await newDeviceContext.createSites(['CHIZ'])
      await newDeviceContext.createDeviceApiKey()
    })
    afterEach(newDeviceContext.afterEach)
    it('should create Device with statusId and add log to DeviceStatusLog table', () =>
      runTest(async knex => {
        const { apiKey, deviceAuth } = newDeviceContext
        assert.isOk(apiKey)

        const messageContext = await createMessageContext()
        messageContext.bindActionCreators({ factGenerateDeviceConnectivity })

        // add device
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: { id: 'DaktariInSight' },
            site: { id: 'CHIZ' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        await waitForIdle()

        const newDevice = await getDeviceFromApiKey(knex, apiKey)
        assert.isOk(newDevice)
        assert.isOk(newDevice.name)
        assert.equal(newDevice.serial, null)

        const deviceLogs = await knex('DeviceStatusLog as dl').where(
          'dl.deviceId',
          newDevice.id
        )
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
          .update({ lastPingOn: last8Day })

        // Generate device offline facts and wait for offline action for new device
        const waitForOffline = waitForAction(deviceOffline(newDevice.id))
        messageContext.factGenerateDeviceConnectivity(newDevice.id)
        await waitForOffline
        await waitForIdle()

        const [offlineFactDevice] = await knex('FactDeviceFlag as fdf').where(
          'fdf.deviceId',
          newDevice.id
        )
        assert.equal(offlineFactDevice.offline, 1)

        const waitForOnline = waitForAction(deviceOnline(newDevice.id))
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: { id: 'DaktariInSight' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        await waitForOnline
        await waitForIdle()

        const [onlineFactDevice] = await knex('FactDeviceFlag as fdf').where(
          'fdf.deviceId',
          newDevice.id
        )
        assert.equal(onlineFactDevice.offline, 0)
      }))
  })

  describe('add device Logs', () => {
    it('should create add payload to DeviceLog on Joi failure', () =>
      runTest(async knex => {
        const { apiKey, deviceAuth } = context
        assert.isOk(apiKey)

        const [{ count: logLength1 }] = await knex('DeviceLog as dl').count(
          'id as count'
        )
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            site: {
              data: `Device API Test - should create add payload to DeviceLog on Joi failure ${Date.now()}`,
            },
          })
          .then(res => {
            assert.equal(res.status, 400)
          })

        const [{ count: logLength2 }] = await knex('DeviceLog as dl').count(
          'id as count'
        )

        assert.equal(logLength1 + 1, logLength2)
      }))
  })
})
