const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const sharedDevice = require('./deviceToken')

const { run } = require('../../src/db')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Device API routes', () => {
  describe('configuration', () => {
    let clientPath = '/api/device/configuration'
    shared.checkToken(server, clientPath)
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    const devicePath = '/device'
    const deviceConfigurationPath = '/device/configuration'

    it('should add and return device configuration', () => run(function* (knex) {
      const { deviceId } = sharedDevice
      clientPath += (`?deviceId=${deviceId}`)

      let initialDataLength = 0
      const configIds = []

      const clientAuth = `Bearer ${shared.token}`
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

      const [{ prevConfigId }] = yield knex('Device').where({ id: deviceId })
        .select('deviceConfigurationId as prevConfigId')

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
          assert.property(res.body, 'updatedOn')
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
          assert.property(res.body.configuration, 'updatedOn')
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

      // cleanup
      yield knex('Device').where({ id: deviceId }).update({ deviceConfigurationId: prevConfigId })
      yield knex('DeviceConfiguration').whereIn('externalId', configIds).delete()
      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, initialDataLength)
          assert.property(res.body, 'total')
        })
    }))
  })

  describe('operation', () => {
    let clientPath = '/api/device/operation'
    shared.checkToken(server, clientPath)
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin' })

    const devicePath = '/device'
    const deviceOperationPath = '/device/operation'

    it('should add and return device operation', () => run(function* (knex) {
      const { deviceId } = sharedDevice
      clientPath += (`?deviceId=${deviceId}`)

      let initialDataLength = 0
      const opIds = []

      const clientAuth = `Bearer ${shared.token}`
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

      const [{ prevOpId }] = yield knex('Device').where({ id: deviceId })
        .select('deviceOperationId as prevOpId')

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
          assert.property(res.body, 'updatedOn')
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
          assert.property(res.body.operation, 'updatedOn')
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

      // cleanup
      yield knex('Device').where({ id: deviceId }).update({ deviceOperationId: prevOpId })
      yield knex('DeviceOperation').whereIn('externalId', opIds).delete()
      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, initialDataLength)
          assert.property(res.body, 'total')
        })
    }))
  })
})
