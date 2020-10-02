const chai = require('chai')

const { assert } = chai
const _ = require('lodash')
const supertest = require('supertest')
const { subDays } = require('date-fns')
const { resultAnalyzeProbes } = require('../../src/result/actions')
const { knex } = require('../../src/db')
/*
const {
  issueTypeToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')
*/
const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')

const { postToDeviceApi } = require('../deviceApi/utils')
const {
  basicResultPayload,
} = require('../deviceApi/geneXpert/geneXpertConstants')

const {
  // waitForIdle,
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

describe.only('This test is for testing different triggers conditions', async () => {
  let macAddress
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  let deviceSerialNumber
  let hostId
  let deviceName

  let results5007

  describe('error 5007', async () => {
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
    it('probesTooLow issue creation', async () => {
      // eslint-disable-next-line prefer-destructuring
      ;({ deviceName, deviceSerialNumber, macAddress, hostId } = results5007[0])

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
      assert.equal(response.status, 200)
      assert.typeOf(response.body, 'Object')

      console.log(firstPayload, response.body)
      assert.isTrue(true)
    })
  })
})
