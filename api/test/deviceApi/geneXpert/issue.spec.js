const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const Promise = require('bluebird')
const {
  issueTypeToId,
  issueStatusToId,
} = require('../../../src/shared/dictionary')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { postToDeviceApi } = require('../utils')
const { knex } = require('../../../src/db')

const { waitForIdle, waitForAction } = require('../../utils/mqUtils')
const { deviceModuleDisabled } = require('../../../src/device/actions')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe.only('Integration test for device status', () => {
  const macAddress = 'MAC00000000FAKE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'New GeneXpert Laboratory'

  const context = createGxConnectTestContext(server, {
    countryCode,
    adminUsername,
    adminPassword,
    deviceName,
    macAddress,
  })

  before(context.beforeRegisterAndSetDevice)
  after(context.afterCleanUp)
  it('should create new issue, module disabled ', async () => {
    const { basicDevicePayload } = context
    const { deviceAuth } = context

    // Post to deviceApi to ensure the device in in Aspect
    const response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, basicDevicePayload, {
        configuration: {
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
        },
      }),
    })
    const deviceId = response.body.device.id
    const device = await knex('Device').where({ id: deviceId }).first()
    const waitForModuleDisabledIssue = waitForAction(
      deviceModuleDisabled(
        response.body.device.id,
        '234',
        '2019-10-18T17:08:22.515Z'
      )
    )
    await waitForModuleDisabledIssue
    await waitForIdle(2000)

    const issue = await knex('Issue')
      .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
      .orderBy('createdOn', 'DESC')
      .first()
    assert.equal(device.id, deviceId)
    assert.isArray(JSON.parse(device.configurationData).disabledModules)
    assert.equal(JSON.parse(device.configurationData).disabledModules.length, 2)
    assert.isNotNull(issue.data)

    assert.equal(issue.issueTypeId, await issueTypeToId('ModuleDisabled'))
    assert.equal(JSON.parse(issue.data).disabledOn, '2019-10-18T17:08:22.515Z')
    assert.equal(JSON.parse(issue.data).moduleSerial, '234')

    // Should now create a module disabled issue
  })
  it('should create only one issue module disable ', async () => {
    const { basicDevicePayload } = context
    const { deviceAuth } = context

    // Post to deviceApi to ensure the device in Aspect
    const response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, basicDevicePayload, {
        configuration: {
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
        },
      }),
    })
    const deviceId = response.body.device.id
    // Post to deviceApi to ensure the device in in Aspect
    const response2 = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, basicDevicePayload, {
        configuration: {
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
        },
      }),
    })
    // should be the same device
    assert.equal(response.body.device.id, response2.body.device.id)
    const waitForModuleDisabledIssue = waitForAction(
      deviceModuleDisabled(
        response.body.device.id,
        '234',
        '2019-10-18T17:08:22.515Z'
      )
    )
    await waitForModuleDisabledIssue
    await waitForIdle(2000)

    const { qntIssue } = await knex('Issue')
      .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
      .orderBy('createdOn', 'DESC')
      .count('Id as qntIssue')
      .first()

    // should only have 2 issues only for this device.
    assert.equal(qntIssue, 2)
  })
  it('should merge device configuration Data and create a new issue', async () => {
    const { basicDevicePayload } = context
    const { deviceAuth } = context

    // Post to deviceApi to ensure the device in Aspect
    const response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, basicDevicePayload, {
        configuration: {
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
        },
      }),
    })
    const deviceId = response.body.device.id
    // Post to deviceApi to ensure the device in in Aspect
    const response2 = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, basicDevicePayload, {
        configuration: {
          data: {
            disabledModules: [
              {
                SiteSerialNumber: '777',
                UserId: '1',
                Creation: '2020-08-18T17:08:22.515Z',
              },
            ],
          },
        },
      }),
    })
    // should be the same device
    assert.equal(response.body.device.id, response2.body.device.id)
    const device = await knex('Device')
      .where({
        deviceId: response.body.device.id,
      })
      .first()
    const waitForModuleDisabledIssue = waitForAction(
      deviceModuleDisabled(
        response.body.device.id,
        '777',
        '2020-08-18T17:08:22.515Z'
      )
    )
    await waitForModuleDisabledIssue
    await waitForIdle(2000)
    const { qntIssue } = await knex('Issue')
      .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
      .orderBy('createdOn', 'DESC')
      .count('Id as qntIssue')
      .first()

    // should only have 2 issues only for this device.
    assert.equal(qntIssue, 3)
    const issue = await knex('Issue')
      .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
      .orderBy('createdOn', 'DESC')
      .first()
    assert.equal(device.id, deviceId)
    assert.isArray(JSON.parse(device.configurationData).disabledModules)
    assert.equal(JSON.parse(device.configurationData).disabledModules.length, 3)
    assert.isNotNull(issue.data)

    assert.equal(issue.issueTypeId, await issueTypeToId('ModuleDisabled'))
    assert.equal(JSON.parse(issue.data).disabledOn, '2019-10-18T17:08:22.515Z')
    assert.equal(JSON.parse(issue.data).moduleSerial, '777')
  })
})
