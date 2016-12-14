const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const sharedDevice = require('./deviceToken')
const { getLastDeviceConfigurationId, getLastDeviceOperationId } = require('./utils')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert
const context = sharedDevice.createTestContext(server)

describe('Device API routes', () => {
  const devicePath = '/device'

  const runTest = context.runTest

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  describe('configuration', () => {
    let clientPath = '/api/device/configuration'
    shared.checkToken(server, clientPath)
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    const deviceConfigurationPath = '/device/configuration'

    it('should add and return device configuration', () => runTest(function* (knex) {
      const { deviceId } = sharedDevice
      clientPath += (`?deviceId=${deviceId}`)

      let initialDataLength = 0

      const clientAuth = `Bearer ${shared.token}`
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 0)
          initialDataLength = res.body.data.length
          assert.property(res.body, 'total')
        })

      yield server.post(deviceConfigurationPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'b' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      let previousConfigId = null
      let currentConfigId = yield* getLastDeviceConfigurationId(knex, deviceId)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 1)
          const lastConfig = _.find(res.body.data, { id: currentConfigId })
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.id, currentConfigId)
          assert.deepEqual(lastConfig.data, { a: 'b' })
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
        })

      previousConfigId = currentConfigId
      currentConfigId = yield* getLastDeviceConfigurationId(knex, deviceId)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 2)

          const prevConfig = _.find(res.body.data, { id: previousConfigId })
          assert.typeOf(prevConfig, 'Object')
          assert.equal(prevConfig.id, previousConfigId)
          assert.deepEqual(prevConfig.data, { a: 'b' })

          const lastConfig = _.find(res.body.data, { id: currentConfigId })
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.id, currentConfigId)
          assert.deepEqual(lastConfig.data, { a: 'b', c: 2, d: false, e: { f: 'g' } })
        })
    }))
  })

  describe('operation', () => {
    let clientPath = '/api/device/operation'
    shared.checkToken(server, clientPath)
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    const deviceOperationPath = '/device/operation'

    it('should add and return device operation', () => runTest(function* (knex) {
      const { deviceId } = sharedDevice
      clientPath += (`?deviceId=${deviceId}`)

      let initialDataLength = 0

      const clientAuth = `Bearer ${shared.token}`
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 0)
          initialDataLength = res.body.data.length
          assert.property(res.body, 'total')
        })

      yield server.post(deviceOperationPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'b' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      let previousOpId = null
      let currentOpId = yield* getLastDeviceOperationId(knex, deviceId)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 1)
          const lastOp = _.find(res.body.data, { id: currentOpId })
          assert.typeOf(lastOp, 'Object')
          assert.equal(lastOp.id, currentOpId)
          assert.deepEqual(lastOp.data, { a: 'b' })
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      previousOpId = currentOpId
      currentOpId = yield* getLastDeviceOperationId(knex, deviceId)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 2)

          const prevOp = _.find(res.body.data, { id: previousOpId })
          assert.typeOf(prevOp, 'Object')
          assert.equal(prevOp.id, previousOpId)
          assert.deepEqual(prevOp.data, { a: 'b' })

          const lastOp = _.find(res.body.data, { id: currentOpId })
          assert.typeOf(lastOp, 'Object')
          assert.equal(lastOp.id, currentOpId)
          assert.deepEqual(lastOp.data, { a: 'b', c: 2, d: false, e: { f: 'g' } })
        })
    }))
  })
  describe('add and get device data', () => {
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    it('should add and return device data', () => runTest(function* () {
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

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
