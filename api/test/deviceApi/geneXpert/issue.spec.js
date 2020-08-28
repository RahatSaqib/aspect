const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const { subDays } = require('date-fns')
const { issueTypeToId } = require('../../../src/shared/dictionary')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { postToDeviceApi } = require('../utils')
const { knex } = require('../../../src/db')
const { basicResultPayload } = require('./geneXpertConstants')
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

  describe('module disable issue', () => {
    beforeEach(context.beforeRegisterAndSetDevice)
    // afterEach(context.afterCleanUp)
    it.only('should create new issue for module disabled, then one for module replaced and change the status of the module disabled issue.', async () => {
      const { basicDevicePayload } = context
      const { deviceAuth } = context
      const firstPayload = _.merge({}, basicDevicePayload, basicResultPayload, {
        result: {
          startedOn: subDays(new Date(), 2),
          endedOn: subDays(new Date(), 2),
          instrument: {
            serial: '123456',
            module: {
              serial: '234',
              name: 'A1',
            },
          },
        },
      })

      // Post to deviceApi to ensure the device in  Aspect and with 1 result with a particular module
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: firstPayload,
      })

      assert.equal(response.statusCode, 200)

      const responseDeviceWithDisabledModule = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          configuration: {
            data: {
              disabledModules: [
                {
                  SiteSerialNumber: '234',
                  UserId: '1',
                  Creation: '2020-08-18T17:08:22.515Z',
                },
              ],
            },
          },
        }),
      })
      const waitForModuleDisabledIssue = waitForAction(
        deviceModuleDisabled(
          response.body.device.id,
          '234',
          '2020-08-18T17:08:22.515Z'
        )
      )
      await waitForModuleDisabledIssue
      await waitForIdle()

      const issues = await knex('Issue')
        .where({ deviceId: response.body.device.id })
        .orderBy('createdOn', 'DESC')
        .select()
      console.log('issueModuleDisabled', issues)

      assert.equal(responseDeviceWithDisabledModule.statusCode, 200)

      const now = subDays(new Date(), 1)
      const responseWithIssue = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, basicResultPayload, {
          result: {
            id: 'UNIQUE-RESULT-ID2',
            startedOn: now,
            endedOn: now,
            sample: {
              id: 'ANOTHERSAMPLE-ID',
            },
            patient: {
              id: 'another-patient',
            },
            instrument: {
              serial: '123456',
              module: {
                serial: '654321',
                name: 'A1',
              },
            },
          },
        }),
      })
      await waitForIdle(5000)
      const results = await knex('Result').where({
        deviceId: responseWithIssue.body.device.id,
      })
      const issues2 = await knex('Issue')
        .where({ deviceId: response.body.device.id })
        .orderBy('createdOn', 'DESC')
        .select()
      console.log('issueModuleReplaced', results, issues2)

      assert.equal(responseWithIssue.statusCode, 200)
    })
    it('should create new issue per module disabled ', async () => {
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
      await waitForIdle()

      const issue = await knex('Issue')
        .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
        .andWhere(knex.raw('data->>"$.moduleSerial"=?', ['234']))
        .orderBy('createdOn', 'DESC')
        .first()
      assert.equal(device.id, deviceId)
      assert.isArray(JSON.parse(device.configurationData).disabledModules)
      assert.equal(
        JSON.parse(device.configurationData).disabledModules.length,
        2
      )
      assert.isNotNull(issue.data)

      assert.equal(issue.issueTypeId, await issueTypeToId('ModuleDisabled'))
      assert.equal(
        JSON.parse(issue.data).disabledOn,
        '2019-10-18T17:08:22.515Z'
      )
      assert.equal(JSON.parse(issue.data).moduleSerial, '234')

      // Should now create a module disabled issue
    })
    it('should create only one issue per module disable on a repeated payload ', async () => {
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
      assert.equal(response.statusCode, 200)
      const deviceId = response.body.device.id
      const waitForModuleDisabledIssue1 = waitForAction(
        deviceModuleDisabled(
          response.body.device.id,
          '234',
          '2019-10-18T17:08:22.515Z'
        )
      )

      await waitForModuleDisabledIssue1

      await waitForIdle()
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
      assert.equal(response.statusCode, 200)

      // should be the same device
      assert.equal(response.body.device.id, response2.body.device.id)
      await waitForModuleDisabledIssue1
      await waitForIdle()

      const { qntIssue } = await knex('Issue')
        .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
        .orderBy('createdOn', 'DESC')
        .count('Id as qntIssue')
        .first()

      // should only have 2 issues for this device.
      assert.equal(qntIssue, 2)
    })
    it('should create a new issue of the novelty only', async () => {
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
      assert.equal(response.statusCode, 200)

      const waitForModuleDisabledIssue1 = waitForAction(
        deviceModuleDisabled(
          response.body.device.id,
          '234',
          '2019-10-18T17:08:22.515Z'
        )
      )
      await waitForModuleDisabledIssue1
      await waitForIdle()
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
                {
                  SiteSerialNumber: '777',
                  UserId: '1',
                  Creation: '2020-05-18T17:08:22.515Z',
                },
              ],
            },
          },
        }),
      })
      // should be the same device
      assert.equal(response.body.device.id, response2.body.device.id)
      await waitForAction(
        deviceModuleDisabled(
          response.body.device.id,
          '777',
          '2020-05-18T17:08:22.515Z'
        )
      )
      await waitForIdle()
      const device = await knex('Device')
        .where({
          id: response.body.device.id,
        })
        .first()
      const { qntIssue } = await knex('Issue')
        .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
        .count('Id as qntIssue')
        .first()

      assert.isArray(JSON.parse(device.configurationData).disabledModules)
      assert.equal(
        JSON.parse(device.configurationData).disabledModules.length,
        3
      )
      // should only have 3 issues for this device.
      assert.equal(qntIssue, 3)
      const issue = await knex('Issue')
        .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
        .andWhere(knex.raw('data->>"$.moduleSerial"=?', ['777']))
        .orderBy('createdOn', 'DESC')
        .first()

      assert.isNotNull(issue.data)

      assert.equal(issue.issueTypeId, await issueTypeToId('ModuleDisabled'))
      assert.equal(
        JSON.parse(issue.data).disabledOn,
        '2020-05-18T17:08:22.515Z'
      )
      assert.equal(JSON.parse(issue.data).moduleSerial, '777')
    })
  })
})
