const supertest = require('supertest')
const chai = require('chai')
const {
  createTestContext,
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

    it('should add and return device configuration', () => runTest(function* (knex) {
      const { deviceAuth } = context

      yield server.post(deviceConfigurationPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'b' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
        })
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

      let previousOpId = null
      let currentOpId = yield* getLastDeviceOperationId(knex, deviceId)

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      previousOpId = currentOpId
      currentOpId = yield* getLastDeviceOperationId(knex, deviceId)
    }))
  })
  describe('add and get device data', () => {
    it('should add and return device data', () => runTest(function* () {
      const { deviceAuth } = context

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

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
          configuration: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } },
          operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } }
        })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
    }))
  })
})
