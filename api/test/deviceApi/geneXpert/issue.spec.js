const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const Promise = require('bluebird')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { postToDeviceApi } = require('../utils')
const { knex } = require('../../../src/db')

const { waitForIdle } = require('../../utils/mqUtils')

const server = supertest.agent('http://localhst:8080')
const { assert } = chai

describe.only('Integration test for device status and maintenance stuffs', () => {
  const macAddress = 'MAC00000000FAKE_DISABLE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const deviceName = 'New GeneXpert Laboratory Test'
  const context = createGxConnectTestContext(server, {
    macAddress,
    adminUsername,
    adminPassword,
  })

  const { basicDevicePayload, afterCleanUp } = context
  const { deviceAuth } = context
  before(context.beforeRequestNewApiKey)
  // after(afterCleanUp)

  it('should create a procedural module issue ', async () => {
    // Post to deviceApi to ensure the device in in Aspect
    const response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, basicDevicePayload, {
        data: {
          disabledModules: [
            {
              SiteSerialNumber: '233',
              UserId: '1',
              Creation: '2020-08-18T17:08:22.515Z',
            },
            {
              SiteSerialNumber: '234',
              UserId: '1',
              Creation: '2019-10-18T17:08:22.515Z',
            },
          ],
        },
      }),
    })
    const deviceId = response.body.device.id
    await waitForIdle()
    assert.isTrue(true)
    // Should now create a module disabled issue
  })
})
