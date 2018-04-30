const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const setMilliseconds = require('date-fns/set_milliseconds')
const { createGxAlertTestContext } = require('./gxalert_utils')
const { postToDeviceApi } = require('./utils')
const { basicResultPayload } = require('./geneXpertConstants')
const { run } = require('../../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const { resultModuleTemperatureError } = require('../../../src/result/actions')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../../utils/mqUtils')

describe.only('Issue endpoints', () => {
  function createContext() {
    return createGxAlertTestContext(server)
  }
  const gxAlertDeviceId = 23847
  const deviceName = 'This Lab Has Results!'

  const context = createContext()
  const {
    beforeCreateGxAlertApiKey,
    useGxAlertDeviceId,
    basicDevicePayload,
    runTest,
    afterCleanUp,
  } = context
  let { deviceAuth, device: gxAlertDevice } = context
  before(async () =>
    run(async () => {
      await beforeCreateGxAlertApiKey()
      useGxAlertDeviceId(gxAlertDeviceId)
      ;({ deviceAuth, device: gxAlertDevice } = context)
    })
  )
  after(afterCleanUp)

  it('should create/update issue for results with related error code', () =>
    runTest(async knex => {
      const { now } = context
      const errorCode = '4010'

      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ resultModuleTemperatureError })

      // Post to deviceApi to ensure the device in in Aspect
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      const deviceId = response.body.device.id

      for (let i = 0; i < 5; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-ERROR-RESULT-${i}`
        const sampleId = `BBC2542552${i}`
        const moduleSerial = `654321`
        const instrumentSerial = `CEPH-PC-123${i}`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)
        const payload = _.merge(
          {},
          basicDevicePayload,
          { name: deviceName },
          basicResultPayload,
          {
            result: {
              id: errorTestResultId,
              startedOn: testStartedOn,
              endedOn: testEndedOn,
              error: {
                code: errorCode,
              },
              sample: { id: sampleId },
              instrument: {
                serial: instrumentSerial,
                module: {
                  serial: moduleSerial,
                  name: 'A1',
                },
              },
            },
          }
        )

        if (i < 4) {
          // Post the result to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        } else {
          // Should create issue when errors > 4
          const waitForModuleTemperatureError = waitForAction(
            resultModuleTemperatureError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleTemperatureError
          await waitForIdle()

          const issues = await knex('Issue as i')
            .join('IssueType as it', 'i.issueTypeId', 'it.id')
            .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
            .where({ 'i.deviceId': deviceId })
            .select(
              'i.id',
              'it.externalId as issueType',
              'i.deviceId',
              'is.externalId as issueStatus'
            )
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModuleTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))
})
