const chai = require('chai')
const Promise = require('bluebird')

const { assert } = chai
const _ = require('lodash')
const supertest = require('supertest')
const { subDays } = require('date-fns')
const { resultAnalyzeErrors } = require('../../src/result/actions')
const { knex } = require('../../src/db')

const {
  issueTypeToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')

const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')

const { postToDeviceApi } = require('../deviceApi/utils')
const {
  basicResultPayload,
} = require('../deviceApi/geneXpert/geneXpertConstants')

const { waitForIdle, waitForAction } = require('../utils/mqUtils')

const server = supertest.agent('http://localhost:8080')
const checkNotificationsForIssue = async issueId => {
  const notification = await knex('Notification as n')
    .join('EmailMessage as em', 'n.emailmessageId', 'em.id')
    .where({ 'n.issueId': issueId })
    .first()

  assert.isNotNull(notification)
  assert.isNotNull(notification.emailMessageId)
  assert.isNotNull(notification.alertMessageId)
  assert.isNotNull(notification.smsMessageId)
}
const getIssues = (deviceId, issueTypeId) =>
  knex('Issue')
    .where({ deviceId, issueTypeId })
    .orderBy('createdOn', 'DESC')
    .select()
const evaluateIssues = async (response, issueTypeId) => {
  assert.equal(response.status, 200)
  assert.typeOf(response.body, 'Object')
  const issues = await getIssues(response.body.device.id, issueTypeId)

  assert.equal(issues.length, 1)
  assert.equal(issues[0].issueStatusId, await issueStatusToId('Active'))

  await checkNotificationsForIssue(issues[0].id)
}
describe('This test suite is for testing different triggers conditions', async () => {
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const macAddress = 'MAC00000000FAKE'
  let results5007

  const deviceName = 'New GeneXpert Laboratory'
  const deviceSerialNumber = 'Cepheid-PC-BLH'
  const hostId = 'BLH-Expert'
  const getPayload = thecontext =>
    _.merge(
      {},
      thecontext.basicDevicePayload,
      { name: thecontext.device.name },
      {
        configuration: {
          data: {
            macAddress: thecontext.device.macAddress,
            hostId: thecontext.device.hostId,
            deviceSerialNumber: thecontext.device.deviceSerialNumber,
          },
        },
      },
      basicResultPayload,
      {
        result: {
          id: 'Error-5007-result',
          startedOn: subDays(new Date(), 2),
          endedOn: subDays(new Date(), 2),
          assay: { id: 'GxMtbRif' },
          consumable: {
            lot: 'Lot 0',
          },
          error: {
            code: '5007',
            notes: 'some ,notes',
          },
          instrument: {
            serial: results5007.instrumentSerial,
            module: {
              serial: results5007.moduleSerial,
              name: results5007.moduleName,
            },
          },
        },
      }
    )
  describe('Probes check Too Low issue creation (Module and lot), error 5007', async () => {
    let context
    let anotherDeviceContext
    before(async () => {
      context = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName,
        macAddress,
        hostId,
        deviceSerialNumber,
      })
      anotherDeviceContext = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName: `2nd${deviceName}`,
        macAddress: `2nd${macAddress}`,
        hostId: `2nd${hostId}`,
        deviceSerialNumber: `2nd${deviceSerialNumber}`,
      })
    })
    beforeEach(async () => {
      await context.beforeRegisterAndSetDevice()
      await anotherDeviceContext.beforeRegisterAndSetDevice()
      await Promise.each(_.range(0, 3), async i => {
        await context.createResultForThisDevice({
          resultDetails: {
            consumableLot: 'Lot 0',
            moduleName: 'Module A',
            moduleSerial: 'M-123456-0',
            instrumentSerial: 'S-1234-0',
            errorCode: i === 0 ? '5007' : null,
            errorNotes: i === 0 ? 'Some notes' : null,
          },
        })
        await anotherDeviceContext.createResultForThisDevice({
          resultDetails: {
            consumableLot: 'Lot 0',
            moduleName: 'Module A',
            moduleSerial: 'M-ANOTHERSERIAL-0',
            instrumentSerial: 'S-ANOTHERSERIAL-0',
            errorCode: i === 0 ? '5007' : null,
            errorNotes: i === 0 ? 'Some notes' : null,
          },
        })
      })
      ;[results5007] = await context.getAllResults()
    })
    afterEach(() => context.afterCleanUp())

    it('should only create one issue per device', async () => {
      /**
       * in this testcase we are testing:
       * 1) issueFilter function for this testCondition (With error 5007)
       * 2) Trigger condition based on a function ( Evaluate the number of test with error this module/lot has)
       * 3) the creation of the issue
       * 4) check if the different noifications were generated.
       */
      // eslint-disable-next-line prefer-destructuring
      const { consumableLot } = results5007
      const { deviceAuth } = context

      const firstPayload = getPayload(context)

      const anotherDevicePayload = getPayload(anotherDeviceContext)
      const waitForAnalyze = waitForAction(resultAnalyzeErrors)
      // Post to deviceApi to ensure the device in  Aspect and with 1 result with a particular module
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: firstPayload,
      })
      await waitForAnalyze
      await waitForIdle()
      await evaluateIssues(
        response,
        await issueTypeToId('ProbeCheckTooLowModule')
      )

      // Post 4 new results with lot (shouldn't trigger another issue if the previous message generated one.)
      await Promise.each(_.range(1, 4), async i => {
        const resp = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(firstPayload, {
            assay: { id: 'GxMtbRif' },
            result: {
              id: `Error-5007-result${i}`,
              startedOn: subDays(new Date(), i),
              endedOn: subDays(new Date(), i),
              consumable: {
                lot: consumableLot,
              },
            },
          }),
        })
        await waitForIdle()
        await evaluateIssues(
          resp,
          await issueTypeToId('ProbeCheckTooLowModule')
        )
      })

      /**
       * We are going to push the same lot for a different device and we are going to expect to create a new issue
       */
      const anotherDeviceResponse = await postToDeviceApi({
        authHeader: anotherDeviceContext.deviceAuth,
        payload: anotherDevicePayload,
      })
      await waitForIdle()
      await evaluateIssues(
        anotherDeviceResponse,
        await issueTypeToId('ProbeCheckTooLowModule')
      )
      await evaluateIssues(
        anotherDeviceResponse,
        await issueTypeToId('ProbeCheckTooLowLot')
      )
    })
  })
})
