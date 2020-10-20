const chai = require('chai')
const Promise = require('bluebird')

const { assert } = chai
const _ = require('lodash')
const supertest = require('supertest')
const { subDays } = require('date-fns')
const { knex } = require('../../src/db')

const {
  issueTypeToId,
  allIssueTypeToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')

const regex = /[^0-9a-zA-Z():,.-]+/gm
const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')

const { postToDeviceApi } = require('../deviceApi/utils')
const {
  basicResultPayload,
} = require('../deviceApi/geneXpert/geneXpertConstants')

const { waitForIdle } = require('../utils/mqUtils')

const getMessageTemplates = async () => {
  const {
    ProbeCheckTooLowModule: ProbeCheckTooLowModuleId,
    ProbeCheckTooLowLot: ProbeCheckTooLowLotId,
    ProbeCheckFailedModuleLot: ProbeCheckFailedModuleId,
  } = await allIssueTypeToId()

  const defaultMessageModule = errorCode =>
    `(${errorCode}) on (M-ANOTHERSERIAL-0) at 2ndNew GeneXpert Laboratory

    Total ${errorCode} errors in the last 30 days: 2

    Country: United States

    Lab contacts:

    Instrument Serial: S-ANOTHERSERIAL-0

    Software Version: 4.7b,

    Cartridge Type: GeneXpert MTB/Rif,

    Sender User: Big Boy Baumgartner,

    Test Outcome: Error,

    Module Serial: M-ANOTHERSERIAL-0

    Module Slot: Module A`.replace(regex, '')

  const defaultmessageLot = errorCode =>
    `(${errorCode}) on Lot (Lot 0) at 2ndNew GeneXpert Laboratory

  Total ${errorCode} errors in the last 30 days: 6

  Country: United States

  Lab contacts: Admin,Gates RDT Admin

  Instrument Serial: M-ANOTHERSERIAL-0

  Software Version: 4.7b,

  Cartridge Type: GeneXpert MTB/Rif,

  Sender User: Big Boy Baumgartner,

  Test Outcome: Error,

  Reagent Lot: Lot 0`.replace(regex, '')

  const messageTemplates = {}
  messageTemplates[ProbeCheckTooLowModuleId] = {
    email: `Probe Check Too Low ${defaultMessageModule(5007)}`,
    sms:
      'Probe Check Too Low (5007) on (M-123456-0) at New GeneXpert Laboratory',
  }
  messageTemplates[ProbeCheckTooLowLotId] = {
    sms:
      'Probe Check Too Low (5007) on lot (Lot 0) at 2ndNew GeneXpert Laboratory',
    email: `Probe Check Too Low (5007) ${defaultmessageLot(5007)}`,
  }
  messageTemplates[ProbeCheckFailedModuleId] = {
    email: `Probe Check Failed ${defaultMessageModule(5017)}`,
    sms:
      'Probe Check Failed (5017) on (M-123456-0) at New GeneXpert Laboratory',
  }
  return messageTemplates
}
const server = supertest.agent('http://localhost:8080')
const checkNotificationsForIssue = async (issueId, issueTypeId) => {
  const messageTemplates = await getMessageTemplates()
  const notification = await knex('Notification as n')
    .join('EmailMessage as em', 'n.emailmessageId', 'em.id')
    .join('SmsMessage as sms', 'n.smsMessageId', 'sms.id')
    .where({ 'n.issueId': issueId })
    .first()

  assert.isNotNull(notification)
  assert.isNotNull(notification.emailMessageId)
  assert.isNotNull(notification.alertMessageId)
  assert.isNotNull(notification.smsMessageId)
  assert.isTrue(notification.message.indexOf('null') < 0)
  assert.isTrue(
    notification.message.indexOf('{{') < 0 &&
      notification.message.indexOf('}}') < 0
  )
  assert.isTrue(
    notification.body.indexOf('{{') < 0 && notification.body.indexOf('}}') < 0
  )

  if (
    !notification.message.indexOf('M-123456-0') > 0 &&
    issueTypeId === (await issueTypeToId('ProbeCheckTooLowModule'))
  ) {
    assert.containSubset(
      notification.body.toString().replace(regex, ''),
      messageTemplates[issueTypeId].email
    )

    assert.containSubset(
      notification.message,
      messageTemplates[issueTypeId].sms
    )
  }
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

  await checkNotificationsForIssue(issues[0].id, issueTypeId)
}

describe.only('This test suite is for testing different triggers conditions', async () => {
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const macAddress = 'MAC00000000FAKE'
  let results

  const deviceName = 'New GeneXpert Laboratory'
  const deviceSerialNumber = 'Cepheid-PC-BLH'
  const hostId = 'BLH-Expert'
  const getPayload = async (
    thecontext,
    errorCode,
    resultCategoryExternalId
  ) => {
    ;[results] = await thecontext.getAllResults()
    return _.merge(
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
          id: `Error-${errorCode}-result${_.random(1, 100, false)}`,
          startedOn: subDays(new Date(), _.random(1, 10, false)),
          endedOn: subDays(new Date(), _.random(1, 10, false)),
          assay: { id: 'GxMtbRif' },
          consumable: {
            lot: 'Lot 0',
          },
          error: {
            code: `${errorCode}`,
            notes: 'some ,notes',
          },
          data: {
            resultText: resultCategoryExternalId
              ? resultCategoryExternalId.toUpperCase()
              : null,
          },
          instrument: {
            serial: results.instrumentSerial,
            module: {
              serial: results.moduleSerial,
              name: results.moduleName,
            },
          },
        },
      }
    )
  }
  const testCategoriesAndErrorCodes = (
    issueName,
    errorCode,
    issueTypeModule,
    issueTypeLot,
    resultCategoryExternalId
  ) => {
    describe(`${issueName} issue creation (Module and lot),${
      errorCode ? `error ${errorCode}` : `category ${resultCategoryExternalId}`
    }`, async () => {
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
              errorCode: i === 0 ? errorCode : null,
              errorNotes: i === 0 ? 'Some notes' : null,
              resultCategory1:
                i === 0 && resultCategoryExternalId
                  ? await issueTypeToId(resultCategoryExternalId)
                  : null,
            },
          })
          await anotherDeviceContext.createResultForThisDevice({
            resultDetails: {
              consumableLot: 'Lot 0',
              moduleName: 'Module A',
              moduleSerial: 'M-ANOTHERSERIAL-0',
              instrumentSerial: 'S-ANOTHERSERIAL-0',
              errorCode: i === 0 ? errorCode : null,
              errorNotes: i === 0 ? 'Some notes' : null,
              resultCategory1:
                i === 0 && resultCategoryExternalId
                  ? await issueTypeToId(resultCategoryExternalId)
                  : null,
            },
          })
        })
      })
      afterEach(() => context.afterCleanUp())

      it(`should only create one issue per device ${
        errorCode ? `error ${errorCode}` : `category${resultCategoryExternalId}`
      }`, async () => {
        /**
         * in this testcase we are testing:
         * 1) issueFilter function for this testCondition (With error 5007)
         * 2) Trigger condition based on a function ( Evaluate the number of test with error this module/lot has)
         * 3) the creation of the issue
         * 4) check if the different noifications were generated.
         */

        const consumableLot = 'Lot 0'
        const { deviceAuth } = context

        const firstPayload = await getPayload(
          context,
          errorCode,
          resultCategoryExternalId
        )

        const anotherDevicePayload = await getPayload(
          anotherDeviceContext,
          errorCode,
          resultCategoryExternalId
        )

        // Post to deviceApi to ensure the device in  Aspect and with 1 result with a particular module
        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: firstPayload,
        })
        await waitForIdle(1000)
        await evaluateIssues(
          response,
          await issueTypeToId(issueTypeModule),
          errorCode
        )

        // Post 4 new results with lot (shouldn't trigger another issue if the previous message generated one.)
        await Promise.each(_.range(1, 4), async i => {
          const resp = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge(firstPayload, {
              assay: { id: 'GxMtbRif' },
              result: {
                id: `Error-${errorCode}-result${i}`,
                startedOn: subDays(new Date(), i),
                endedOn: subDays(new Date(), i),
                consumable: {
                  lot: consumableLot,
                },
              },
              data: {
                resultText: resultCategoryExternalId
                  ? resultCategoryExternalId.toUpperCase()
                  : null,
              },
            }),
          })
          await waitForIdle()
          await evaluateIssues(
            resp,
            await issueTypeToId(issueTypeModule),
            errorCode
          )
        })

        /**
         * We are going to push the same lot for a different device and we are going to expect to create a new issue
         */
        const anotherDeviceResponse = await postToDeviceApi({
          authHeader: anotherDeviceContext.deviceAuth,
          payload: anotherDevicePayload,
        })
        await waitForIdle(1000)
        await evaluateIssues(
          anotherDeviceResponse,
          await issueTypeToId(issueTypeModule),
          errorCode
        )
        await evaluateIssues(
          anotherDeviceResponse,
          await issueTypeToId(issueTypeLot),
          errorCode
        )
      })
    })
  }
  describe('error 5006 issue', async () => {
    await testCategoriesAndErrorCodes(
      'Probes check Too High',
      5006,
      'ProbeCheckTooHighModule',
      'ProbeCheckTooHighLot'
    )
  })
  describe('error 5007 issue', async () => {
    await testCategoriesAndErrorCodes(
      'Probes check Too Low',
      5007,
      'ProbeCheckTooLowModule',
      'ProbeCheckTooLowLot'
    )
  })
  describe('error 5017 issue', async () => {
    await testCategoriesAndErrorCodes(
      'Probes Check Failed',
      5017,
      'ProbeCheckFailedModule',
      'ProbeCheckFailedLot'
    )
  })
  describe('Invalid results', async () => {
    await testCategoriesAndErrorCodes(
      'Too Many Invalid Results',
      null,
      'TooManyInvalidResultsModule',
      'TooManyInvalidResultsLot',
      'Invalid'
    )
  })
})
