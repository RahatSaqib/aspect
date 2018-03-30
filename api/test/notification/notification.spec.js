const supertest = require('supertest')
const chai = require('chai')
const { createTestContext, getDeviceFromApiKey } = require('../deviceApi/utils')
const {
  deviceOffline,
  types: { DEVICE_OFFLINE },
} = require('../../src/device/actions')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createTestContext(server, {
  user: 'myanmar_admin',
  partner: 'myanmar',
})

describe('Notification endpoints', () => {
  const devicePath = '/device'

  const { runTest } = context

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  describe('Device Offline', () => {
    it('should create Notification when DeviceOffline', () =>
      runTest(async knex => {
        const { apiKey, deviceAuth, createMessageContext } = context
        assert.isOk(apiKey)

        const messageContext = await createMessageContext()
        messageContext.bindActionCreators({ deviceOffline })

        // add device
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: { id: 'GenericRDT' },
            site: { id: 'Hinthada TBC' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const newDevice = await getDeviceFromApiKey(knex, apiKey)
        assert.isOk(newDevice)
        assert.isOk(newDevice.name)
        assert.equal(newDevice.serial, null)

        // Notify device offline and wait for completion
        const waitForOffline = context.waitForAction({
          type: DEVICE_OFFLINE,
          deviceId: newDevice.id,
        })
        messageContext.deviceOffline(newDevice.id)
        await waitForOffline
      }))
  })
})
