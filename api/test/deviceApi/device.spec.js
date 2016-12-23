const supertest = require('supertest')
const chai = require('chai')
const {
  createTestContext,
  getDeviceConfigurationData,
  getLastDeviceOperationData,
  getLastDeviceOperationId } = require('./utils')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert
const context = createTestContext(server, { user: 'admin' })

describe('Device API routes', () => {
  const devicePath = '/device'

  const runTest = context.runTest

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  describe('configuration', () => {
    const deviceConfigurationPath = '/device/configuration'

    it('should add and merge device configuration', () => runTest(function* (knex) {
      const { deviceAuth, deviceId } = context

      yield server.post(deviceConfigurationPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'b' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      const config1 = yield* getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(config1, { a: 'b' })

      yield server.post(deviceConfigurationPath)
        .set('Authorization', deviceAuth)
        .send({ data: { b: 3 } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      const config2 = yield* getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(config2, { a: 'b', b: 3 })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { a: 'e', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
        })
      const config3 = yield* getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(config3, { a: 'e', b: 3, c: 2, d: false, e: { f: 'g' } })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { e: { f: 'h' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
        })
      const config4 = yield* getDeviceConfigurationData(knex, deviceId)
      assert.deepEqual(config4, { a: 'e', b: 3, c: 2, d: false, e: { f: 'h' } })
    }))
  })

  describe('operation', () => {
    const deviceOperationPath = '/device/operation'

    it('should add and return device operation', () => runTest(function* (knex) {
      const { deviceId, deviceAuth } = context

      yield server.post(deviceOperationPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'b' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      const op1 = yield* getLastDeviceOperationData(knex, deviceId)
      assert.deepEqual(op1, { a: 'b' })

      let previousOpId = null
      let currentOpId = yield* getLastDeviceOperationId(knex, deviceId)

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      const op2 = yield* getLastDeviceOperationData(knex, deviceId)
      assert.deepEqual(op2, { a: 'b', c: 2, d: false, e: { f: 'g' } })

      previousOpId = currentOpId
      currentOpId = yield* getLastDeviceOperationId(knex, deviceId)

      assert.notEqual(previousOpId, currentOpId)
    }))
  })
  describe('add and get device data', () => {
    it('should add and return device data', () => runTest(function* (knex) {
      const { deviceAuth, deviceId } = context

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          checkpoint: '124j',
          configuration: { data: { a: 'b' } },
          operation: { data: { a: 'b' } }
        })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      const config1 = yield* getDeviceConfigurationData(knex, deviceId)
      const op1 = yield* getLastDeviceOperationData(knex, deviceId)
      assert.deepEqual(config1, { a: 'b' })
      assert.deepEqual(op1, { a: 'b' })

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'checkpoint')
          assert.equal(res.body.checkpoint, '124j')
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          configuration: { data: { a: 'c', c: 2, d: false, e: { f: 'g' } } },
          operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } }
        })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      const config2 = yield* getDeviceConfigurationData(knex, deviceId)
      const op2 = yield* getLastDeviceOperationData(knex, deviceId)
      assert.deepEqual(config2, { a: 'c', c: 2, d: false, e: { f: 'g' } })
      assert.deepEqual(op2, { a: 'b', c: 2, d: false, e: { f: 'g' } })

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
    }))
  })
})
