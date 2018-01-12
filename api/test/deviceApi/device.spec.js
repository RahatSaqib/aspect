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

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createTestContext(server, { user: 'admin' })

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

describe('Device API routes', () => {
  const devicePath = '/device'

  const { runTest } = context

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  describe('configuration', () => {
    const deviceConfigurationPath = '/device/configuration'

    it('should add and merge device configuration', () =>
      runTest(function*(knex) {
        const { deviceAuth, deviceId } = context

        yield server
          .post(deviceConfigurationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { a: 'b' } })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
        const config1 = yield* getDeviceConfigurationData(knex, deviceId)
        assert.deepEqual(config1, _.assign({}, baseConfig, { a: 'b' }))

        yield server
          .post(deviceConfigurationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { b: 3 } })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
        const config2 = yield* getDeviceConfigurationData(knex, deviceId)
        assert.deepEqual(config2, _.assign({}, baseConfig, { a: 'b', b: 3 }))

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            configuration: { data: { a: 'e', c: 2, d: false, e: { f: 'g' } } },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const config3 = yield* getDeviceConfigurationData(knex, deviceId)
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

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ configuration: { data: { e: { f: 'h' } } } })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const config4 = yield* getDeviceConfigurationData(knex, deviceId)
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
      runTest(function*(knex) {
        const { deviceId, deviceAuth } = context

        yield server
          .post(deviceOperationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { a: 'b' } })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const op1 = yield* getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual(op1, { a: 'b' })

        let previousOpId = null
        let currentOpId = yield* getLastDeviceOperationId(knex, deviceId)

        yield server
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

        const op2 = yield* getLastDeviceOperation(knex, deviceId)
        assert.deepEqual(op2.data, { a: 'b', c: 2, d: false, e: { f: 'g' } })
        assert.deepEqual(op2.startedOn, new Date('2013-12-01'))
        assert.deepEqual(op2.endedOn, new Date('2013-12-01T01:30'))

        previousOpId = currentOpId
        currentOpId = yield* getLastDeviceOperationId(knex, deviceId)

        assert.notEqual(previousOpId, currentOpId)
      }))
  })
  describe('add and get device data', () => {
    it('should add and return device data', () =>
      runTest(function*(knex) {
        const { deviceAuth, deviceId } = context

        yield server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.status.id, 'approved')
          })

        yield server
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

        const config1 = yield* getDeviceConfigurationData(knex, deviceId)
        const op1 = yield* getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual(config1, _.assign({}, baseConfig, { a: 'b' }))
        assert.deepEqual(op1, { a: 'b' })

        yield server
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

        yield server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'checkpoint')
            assert.equal(res.body.checkpoint, '124j')
          })

        yield server
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

        const config2 = yield* getDeviceConfigurationData(knex, deviceId)
        const op2 = yield* getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual(
          config2,
          _.assign({}, baseConfig, { a: 'c', c: 2, d: false, e: { f: 'g' } })
        )
        assert.deepEqual(op2, { a: 'b', c: 2, d: false, e: { f: 'g' } })

        yield server
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
      runTest(function*(knex) {
        const deviceListPath = '/api/device'
        const { apiKey, deviceId, clientAuth } = context
        const last30Day = subDays(new Date(), 30)
        const last60Day = subDays(last30Day, 30)
        assert.isOk(apiKey)

        const totalResultsLastMonth = yield knex('Result as r')
          .whereBetween('r.endedOn', [last60Day, last30Day])
          .where({ deviceId })
          .countDistinct('r.id as total')

        const totalResultsThisMonth = yield knex('Result as r')
          .where({ deviceId })
          .andWhere('r.endedOn', '>=', last30Day)
          .countDistinct('r.id as total')

        // get total count of results
        yield server
          .get(deviceListPath)
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
      user: 'rrt_admin',
      partner: 'RRT',
    })
    const { runTest } = newDeviceContext

    beforeEach(newDeviceContext.beforeEach)
    afterEach(newDeviceContext.afterEach)
    it('should create Device with statusId and add log to DeviceStatusLog table', () =>
      runTest(function*(knex) {
        const { apiKey, deviceAuth } = newDeviceContext
        assert.isOk(apiKey)

        // add device
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: { id: 'Daktari' },
            site: { id: 'CHIZ' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const newDevice = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isOk(newDevice)
        assert.isOk(newDevice.name)
        assert.equal(newDevice.serial, null)

        const deviceLogs = yield knex('DeviceStatusLog as dl').where(
          'dl.deviceId',
          newDevice.id
        )
        assert.isOk(deviceLogs)
        assert.propertyVal(newDevice, 'id', deviceLogs[0].deviceId)
        assert.isAtLeast(deviceLogs.length, 1)
      }))
  })
})
