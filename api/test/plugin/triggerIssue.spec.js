const chai = require('chai')

const { assert } = chai
const _ = require('lodash')
const supertest = require('supertest')
const { subDays } = require('date-fns')
const { resultAnalyzeProbes } = require('../../src/result/actions')
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

const {
  waitForIdle,
  waitForAction,
  // dispatchAndWaitForAction,
} = require('../utils/mqUtils')

const server = supertest.agent('http://localhost:8080')
const getResults = async errorCode =>
  knex('Result as r')
    .join('Device as d', 'd.id', 'r.deviceid')
    .where({ errorCode })
    .select(
      'r.*',
      'd.name as deviceName',
      'd.serial as deviceSerialNumber',
      'd.hostId',
      'd.macAddress as macAddress'
    )

const getIssues = (deviceId, issueTypeId) =>
  knex('Issue')
    .where({ deviceId, issueTypeId })
    .orderBy('createdOn', 'DESC')
    .select()

describe('This test is for testing different triggers conditions', async () => {
  let macAddress
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  let deviceSerialNumber
  let hostId
  let deviceName
  let consumableLot
  let results5007

  describe.only('error 5007', async () => {
    let context
    before(async () => {
      results5007 = await getResults(5007)
      context = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName: results5007[0].deviceName,
        macAddress: results5007[0].macAddress,
      })
      assert.isAtLeast(results5007.length, 1)
    })
    beforeEach(() => context.beforeRegisterAndSetDevice())
    afterEach(() => context.afterCleanUp())
    it('probesTooLow issue creation, should only create one issue', async () => {
      /**
       * in this testcase we are testing:
       * 1) issueFilter function for this testCondition
       * 2) Trigger condition based on a function.
       * 3) the creation of the issue.
       */
      // eslint-disable-next-line prefer-destructuring
      ;({
        deviceName,
        deviceSerialNumber,
        macAddress,
        hostId,
        consumableLot,
      } = results5007[0])

      const { basicDevicePayload, deviceAuth } = context

      const firstPayload = _.merge(
        {},
        basicDevicePayload,
        { name: deviceName },
        {
          configuration: {
            data: {
              macAddress,
              hostId,
              deviceSerialNumber,
            },
          },
        },
        basicResultPayload,
        {
          result: {
            id: 'Error-5007-result',
            startedOn: subDays(new Date(), 2),
            endedOn: subDays(new Date(), 2),
            consumable: {
              lot: consumableLot,
            },
            error: {
              code: '5007',
              notes: 'some ,notes',
            },
            instrument: {
              serial: results5007[0].instrumentSerial,
              module: {
                serial: results5007[0].moduleSerial,
                name: results5007[0].moduleName,
              },
            },
          },
        }
      )

      const waitForAnalyze = waitForAction(resultAnalyzeProbes)
      // Post to deviceApi to ensure the device in  Aspect and with 1 result with a particular module
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: firstPayload,
      })
      await waitForAnalyze
      await waitForIdle()
      assert.equal(response.status, 200)
      assert.typeOf(response.body, 'Object')
      const issueTypeId = await issueTypeToId('ProbesTooLowModule')
      const issuesForModules = await getIssues(
        response.body.device.id,
        issueTypeId
      )

      // const issuesForLot = await getIssues(
      //   response.body.device.id,
      //   await issueTypeToId('ProbesTooLowLot')
      // )
      /* assert.equal(issuesForLot.length, 1)
      assert.equal(
        issuesForLot[0].issueStatusId,
        await issueStatusToId('Active')
      )
*/
      assert.equal(issuesForModules.length, 1)
      assert.equal(
        issuesForModules[0].issueStatusId,
        await issueStatusToId('Active')
      )

      // Post to deviceApi to ensure the device in  Aspect and with 1 result with a particular module
      const response2 = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge(firstPayload, {
          result: {
            id: 'Error-5007-result2',
            startedOn: subDays(new Date(), 2),
            endedOn: subDays(new Date(), 2),
            consumable: {
              lot: consumableLot,
            },
            error: {
              code: '5007',
              notes: 'some ,notes',
            },
            instrument: {
              serial: results5007[0].instrumentSerial,
              module: {
                serial: results5007[0].moduleSerial,
                name: results5007[0].moduleName,
              },
            },
          },
        }),
      })
      await waitForIdle()
      const issues2 = await getIssues(response2.body.device.id, issueTypeId)
      assert.equal(issues2.length, 1)
      assert.isTrue(true)
    })
  })
})
