const _ = require('lodash')

const chai = require('chai')
const { subDays } = require('date-fns')
const { issueTypeToId, issueStatusToId } = require('../../../src/shared/dictionary')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { postToDeviceApi } = require('../utils')
const { knex } = require('../../../src/db')
const { basicResultPayload } = require('./geneXpertConstants')
const { createMessageContext, waitForIdle, waitForAction, dispatchAndWaitForAction } = require('../../utils/mqUtils')
const { deviceModuleDisabled } = require('../../../src/device/actions')
const { resolveIssues } = require('../../../src/issue/actions')

const server = require('../../utils/testUtils')

const { assert } = chai

describe('Integration test for device status', () => {
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

  const checkIssueStatusByIssueId = async (knex, issueId, statusExternalId) => {
    assert.isOk(issueId)
    assert.isOk(statusExternalId)
    const issue = await knex('Issue as i')
      .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
      .where({ 'i.id': issueId })
      .first('is.externalId as issueStatus')
    assert.isOk(issue)
    assert.isOk(issue.issueStatus)
    assert.equal(issue.issueStatus, statusExternalId)
  }

  describe('module disable issue', () => {
    beforeEach(context.beforeRegisterAndSetDevice)
    afterEach(context.afterCleanUp)

    it('should create new issue for module disabled, then one for module replaced and change the status of the module disabled issue.', async () => {
      /**
       * This test represent the whole workflow of module replacement.
       * 1) Creates a device with a result with a specific module serial
       * 2) Creates a module disable issue, based on the information received in data:{ disabledModules:[....]}
       *    property of the device payload
       * 3) Create a module replaced issue based on a new result of the same instrument with a different serial
       *    number of the same module name.
       * 4) Check if the module disabled issue is resolved.
       *
       */

      /*
       * This is needed to create the instrument and link it to the device,
       * so when we send the result with the instrument serial number the device is identified correctly and we don't create another device
       * TODO: we should move this logic to the device context setup
       */
      await knex('Instrument').insert({
        deviceId: context.device.id,
        serial: '123456',
        active: 1,
        createdOn: new Date(),
        updatedOn: new Date(),
      })

      const { basicDevicePayload } = context
      const { deviceAuth } = context

      const firstPayload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
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

      // Wait for module disable
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ deviceModuleDisabled })
      const waitForModuleDisabledIssue = waitForAction(
        deviceModuleDisabled(context.device.id, '234', '2020-08-18T17:08:22.515Z')
      )
      const responseDeviceWithDisabledModule = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge(
          {},
          basicDevicePayload,
          { name: deviceName },
          {
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
          }
        ),
      })

      assert.equal(response.statusCode, 200)

      await waitForModuleDisabledIssue
      await waitForIdle()

      assert.equal(responseDeviceWithDisabledModule.statusCode, 200)
      const yesterday = subDays(new Date(), 1)
      const waitForModuleReplacedIssue = waitForAction(
        { type: 'RESULT_MODULE_REPLACED', deviceId: context.device.id },
        10000
      )
      const responseWithIssue = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: 'UNIQUE-RESULT-ID2',
            startedOn: yesterday,
            endedOn: yesterday,
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

      await waitForModuleReplacedIssue
      await waitForIdle()
      const issues = await knex('Issue').where({ deviceId: context.device.id }).orderBy('createdOn', 'DESC').select()

      assert.equal(responseWithIssue.statusCode, 200)
      assert.equal(issues.length, 2)
      const moduleDisabledIssueTypeId = await issueTypeToId('ModuleDisabled')
      const moduleDisabledIssue = _.find(issues, issue => issue.issueTypeId === moduleDisabledIssueTypeId)

      assert.isOk(moduleDisabledIssue)
      assert.equal(moduleDisabledIssue.issueStatusId, await issueStatusToId('Active'))
      await dispatchAndWaitForAction(resolveIssues())
      await waitForIdle()
      await checkIssueStatusByIssueId(knex, moduleDisabledIssue.id, 'Resolved')
    })

    it('should create new issue for module disabled and resolve it when new result for the same module is sent', async () => {
      /**
       * This test represent the whole workflow of module reactivation.
       * 1) Creates a device with a result with a specific module serial
       * 2) Creates a module disable issue, based on the information received in data:{ disabledModules:[....]}
       *    property of the device payload
       * 3) Send a new result for the disabled module.
       * 4) Check if the module disabled issue is resolved.
       *
       */

      const { basicDevicePayload } = context
      const { deviceAuth } = context

      const firstPayload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
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

      // Wait for module disable
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ deviceModuleDisabled })
      const waitForModuleDisabledIssue = waitForAction(
        deviceModuleDisabled(context.device.id, '234', '2020-08-18T17:08:22.515Z')
      )
      const responseDeviceWithDisabledModule = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge(
          {},
          basicDevicePayload,
          { name: deviceName },
          {
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
          }
        ),
      })

      assert.equal(response.statusCode, 200)

      await waitForModuleDisabledIssue
      await waitForIdle()

      assert.equal(responseDeviceWithDisabledModule.statusCode, 200)
      const yesterday = subDays(new Date(), 1)
      const reactivationResultResponse = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: 'UNIQUE-RESULT-ID2',
            startedOn: yesterday,
            endedOn: yesterday,
            sample: {
              id: 'ANOTHERSAMPLE-ID',
            },
            patient: {
              id: 'another-patient',
            },
            instrument: {
              serial: '123456',
              module: {
                serial: '234',
                name: 'A1',
              },
            },
          },
        }),
      })

      const issues = await knex('Issue').where({ deviceId: context.device.id }).orderBy('createdOn', 'DESC').select()

      assert.equal(reactivationResultResponse.statusCode, 200)
      assert.equal(issues.length, 1)
      const moduleDisabledIssueTypeId = await issueTypeToId('ModuleDisabled')
      const moduleDisabledIssue = _.find(issues, issue => issue.issueTypeId === moduleDisabledIssueTypeId)

      assert.isOk(moduleDisabledIssue)
      assert.equal(moduleDisabledIssue.issueStatusId, await issueStatusToId('Active'))
      await dispatchAndWaitForAction(resolveIssues(waitForModuleDisabledIssue.id))
      await waitForIdle()
      await checkIssueStatusByIssueId(knex, moduleDisabledIssue.id, 'Resolved')
    })

    it('should create new issue per module disabled ', async () => {
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ deviceModuleDisabled })

      const { basicDevicePayload } = context
      const { deviceAuth } = context
      const waitForModuleDisabledIssue = waitForAction(
        deviceModuleDisabled(context.device.id, '234', '2019-10-18T17:08:22.515Z')
      )
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
      assert.equal(response.statusCode, 200)
      const deviceId = context.device.id
      const device = await knex('Device').where({ id: deviceId }).first()
      await waitForModuleDisabledIssue
      await waitForIdle()

      const issue = await knex('Issue')
        .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
        .andWhere(knex.raw('data->>"$.moduleSerial"=?', ['234']))
        .orderBy('createdOn', 'DESC')
        .first()
      assert.equal(device.id, deviceId)
      assert.isArray(JSON.parse(device.configurationData).disabledModules)
      assert.equal(JSON.parse(device.configurationData).disabledModules.length, 2)
      assert.isNotNull(issue.data)

      assert.equal(issue.issueTypeId, await issueTypeToId('ModuleDisabled'))
      assert.equal(JSON.parse(issue.data).disabledOn, '2019-10-18T17:08:22.515Z')
      assert.equal(JSON.parse(issue.data).moduleSerial, '234')
    })

    it('should create only one issue per module disable on a repeated payload ', async () => {
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ deviceModuleDisabled })
      const waitForModuleDisabledIssue1 = waitForAction(
        deviceModuleDisabled(context.device.id, '234', '2019-10-18T17:08:22.515Z')
      )
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
      const deviceId = context.device.id

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
      assert.equal(response2.statusCode, 200)

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
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ deviceModuleDisabled })
      const { basicDevicePayload } = context
      const { deviceAuth } = context
      const waitForModuleDisabledIssue1 = waitForAction(
        deviceModuleDisabled(context.device.id, '234', '2019-10-18T17:08:22.515Z')
      )
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

      await waitForModuleDisabledIssue1
      await waitForIdle()
      const deviceId = context.device.id
      const deviceDisableEvent = waitForAction(
        deviceModuleDisabled(context.device.id, '777', '2020-05-18T17:08:22.515Z')
      )
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
      assert.equal(response2.statusCode, 200)
      await deviceDisableEvent
      await waitForIdle()
      const device = await knex('Device')
        .where({
          id: context.device.id,
        })
        .first()
      const { qntIssue } = await knex('Issue')
        .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
        .count('Id as qntIssue')
        .first()

      assert.isArray(JSON.parse(device.configurationData).disabledModules)
      assert.equal(JSON.parse(device.configurationData).disabledModules.length, 3)
      // should only have 3 issues for this device.
      assert.equal(qntIssue, 3)
      const issue = await knex('Issue')
        .where({ deviceId, issueTypeId: await issueTypeToId('ModuleDisabled') })
        .andWhere(knex.raw('data->>"$.moduleSerial"=?', ['777']))
        .orderBy('createdOn', 'DESC')
        .first()

      assert.isNotNull(issue.data)

      assert.equal(issue.issueTypeId, await issueTypeToId('ModuleDisabled'))
      assert.equal(JSON.parse(issue.data).disabledOn, '2020-05-18T17:08:22.515Z')
      assert.equal(JSON.parse(issue.data).moduleSerial, '777')
    })
  })
})
