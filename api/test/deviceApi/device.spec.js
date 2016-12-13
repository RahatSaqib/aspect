const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const sharedDevice = require('./deviceToken')
const { deleteTestDataFromCheckpoint } = require('./utils')

const { run } = require('../../src/db')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Device API routes', () => {
  const devicePath = '/device'

  let testCheckpoint
  const testDeviceIds = []

  beforeEach(() => run(function* () {
    testCheckpoint = null
    testDeviceIds.splice(0)
  }))

  function runTest(test) {
    return run(function* (knex) {
      const { deviceId, deviceToken } = sharedDevice
      testDeviceIds.push(deviceId)

      const deviceAuth = `Bearer ${deviceToken}`

      // Does not currently work to create initial checkpoint in beforeEach
      // because of how Device Token is setup, so runTest creates an initial
      // checkpoint and then runs test using db.run
      testCheckpoint = `Device API Device Tests ${new Date()}`
      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ checkpoint: testCheckpoint })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      return yield* test(knex)
    })
  }

  afterEach(() => run(function* (knex) {
    // cleanup
    if (testCheckpoint) {
      yield* deleteTestDataFromCheckpoint(knex, testCheckpoint, testDeviceIds)
      testCheckpoint = null
      testDeviceIds.splice(0)
    }
  }))

  describe('configuration', () => {
    let clientPath = '/api/device/configuration'
    shared.checkToken(server, clientPath)
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    const deviceConfigurationPath = '/device/configuration'

    it('should add and return device configuration', () => runTest(function* () {
      const { deviceId } = sharedDevice
      clientPath += (`?deviceId=${deviceId}`)

      let initialDataLength = 0
      const configIds = []

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
          assert.property(res.body, 'id')
          configIds.push(res.body.id)
        })

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 1)
          const lastConfig = _.find(res.body.data, { externalId: configIds[0] })
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.externalId, configIds[0])
          assert.deepEqual(lastConfig.data, { a: 'b' })
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ configuration: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'configuration')
          assert.property(res.body.configuration, 'id')
          configIds.push(res.body.configuration.id)
        })

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 2)

          const prevConfig = _.find(res.body.data, { externalId: configIds[0] })
          assert.typeOf(prevConfig, 'Object')
          assert.equal(prevConfig.externalId, configIds[0])
          assert.deepEqual(prevConfig.data, { a: 'b' })

          const lastConfig = _.find(res.body.data, { externalId: configIds[1] })
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.externalId, configIds[1])
          assert.deepEqual(lastConfig.data, { a: 'b', c: 2, d: false, e: { f: 'g' } })
        })
    }))
  })

  describe('operation', () => {
    let clientPath = '/api/device/operation'
    shared.checkToken(server, clientPath)
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    const deviceOperationPath = '/device/operation'

    it('should add and return device operation', () => runTest(function* () {
      const { deviceId } = sharedDevice
      clientPath += (`?deviceId=${deviceId}`)

      let initialDataLength = 0
      const opIds = []

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
          assert.property(res.body, 'id')
          opIds.push(res.body.id)
        })

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 1)
          const lastOp = _.find(res.body.data, { externalId: opIds[0] })
          assert.typeOf(lastOp, 'Object')
          assert.equal(lastOp.externalId, opIds[0])
          assert.deepEqual(lastOp.data, { a: 'b' })
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ operation: { data: { a: 'b', c: 2, d: false, e: { f: 'g' } } } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.operation, 'Object')
          assert.property(res.body.operation, 'id')
          opIds.push(res.body.operation.id)
        })

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 2)

          const prevOp = _.find(res.body.data, { externalId: opIds[0] })
          assert.typeOf(prevOp, 'Object')
          assert.equal(prevOp.externalId, opIds[0])
          assert.deepEqual(prevOp.data, { a: 'b' })

          const lastOp = _.find(res.body.data, { externalId: opIds[1] })
          assert.typeOf(lastOp, 'Object')
          assert.equal(lastOp.externalId, opIds[1])
          assert.deepEqual(lastOp.data, { a: 'b', c: 2, d: false, e: { f: 'g' } })
        })
    }))
  })
  describe('add and get device data', () => {
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    it('should add and return device data', () => runTest(function* () {
      const configIds = []
      const opIds = []

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
          assert.property(res.body, 'configuration')
          assert.property(res.body.configuration, 'id')
          configIds.push(res.body.configuration.id)
          assert.typeOf(res.body.operation, 'Object')
          assert.property(res.body.operation, 'id')
          opIds.push(res.body.operation.id)
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
          assert.property(res.body, 'configuration')
          assert.property(res.body.configuration, 'id')
          configIds.push(res.body.configuration.id)
          assert.typeOf(res.body.operation, 'Object')
          assert.property(res.body.operation, 'id')
          opIds.push(res.body.operation.id)
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
