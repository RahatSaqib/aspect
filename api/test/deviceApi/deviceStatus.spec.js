const supertest = require('supertest')
const chai = require('chai')
const {
  createTestContext,
  getDeviceConfigurationData,
  getLastDeviceOperationData,
} = require('./utils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createTestContext(server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  status: 'assigned',
})

describe('Device API status tests', () => {
  const devicePath = '/device'
  const deviceConfigurationPath = '/device/configuration'
  const deviceOperationPath = '/device/operation'

  const { runTest } = context

  beforeEach(async () => {
    await context.createDeviceWithResult()
  })
  afterEach(context.afterEach)

  describe('unapproved', () => {
    it('should not download data for unapproved device', () =>
      runTest(async knex => {
        const { deviceAuth, deviceId } = context
        assert.isOk(deviceId)

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.isNotOk(res.body.configuration)
            assert.isNotOk(res.body.operation)
            assert.isNotOk(res.body.result)
            assert.equal(res.body.status.id, 'assigned')
          })

        const configPre = await getDeviceConfigurationData(knex, deviceId)
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            configuration: { data: { shouldChangeThisThing: 'b' } },
            operation: { data: { shouldChangeThisOtherThing: 'c' } },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const configPost1 = await getDeviceConfigurationData(knex, deviceId)
        assert.deepEqual(
          Object.assign({ shouldChangeThisThing: 'b' }, configPre),
          configPost1
        )
        const opPost1 = await getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual({ shouldChangeThisOtherThing: 'c' }, opPost1)

        await server
          .post(deviceConfigurationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { shouldChangeThisThing: 'c' } })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const configPost2 = await getDeviceConfigurationData(knex, deviceId)
        assert.deepEqual(
          Object.assign({ shouldChangeThisThing: 'c' }, configPre),
          configPost2
        )

        await server
          .post(deviceOperationPath)
          .set('Authorization', deviceAuth)
          .send({ data: { shouldChangeThisOtherThing: 'e' } })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const opPost2 = await getLastDeviceOperationData(knex, deviceId)
        assert.deepEqual({ shouldChangeThisOtherThing: 'e' }, opPost2)

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.isNotOk(res.body.configuration)
            assert.isNotOk(res.body.operation)
            assert.isNotOk(res.body.result)
            assert.equal(res.body.status.id, 'assigned')
          })
      }))
  })
})
