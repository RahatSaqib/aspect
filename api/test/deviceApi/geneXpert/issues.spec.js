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
const { assert, expect } = chai
const { waitForIdle } = require('../../utils/mqUtils')
/* TODO
* import tempModuleError issue? 
* import createMessageContext, waitForIdle, waitForAction etc 
* 
*/

describe('Issue endpoints', () => {
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
    getLastResult,
    afterCleanUp,
  } = context
  let { deviceAuth, device: gxAlertDevice } = context
  // let { device: gxAlertDevice } = context
  beforeEach(async () =>
    run(async () => {
      await beforeCreateGxAlertApiKey()
      useGxAlertDeviceId(gxAlertDeviceId)
      ;({ deviceAuth, device: gxAlertDevice } = context)
    })
  )
  afterEach(afterCleanUp)

  it('should create/update issue for results with related error code', () =>
    // should merge results with same sample ID, start time, end time and instrument serial
    runTest(async knex => {
      const { now } = context
      const errorCode = '4010'
      const resultIds = []
      for (let i = 0; i < 6; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-ERROR-RESULT-${i}`
        const sampleId = `BBC2542552${i}`
        const instrumentSerial = `12345${i}`
        const moduleSerial = `65432${i}`

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
            },
            instrument: {
              serial: instrumentSerial,
              module: {
                serial: moduleSerial,
                name: 'A1',
              },
            },
          }
        )
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload,
        })

        const lastResult = await getLastResult()
        resultIds.push(lastResult.id)
        expect(lastResult).to.containSubset({
          errorCode,
          resultCategory1: 'Error',
          resultWorkflowStatus: 'Error',
          resultData: {
            geneXpertTestId: errorTestResultId,
          },
        })
      }

      const resultId = resultIds.pop()
      const [deviceId] = await knex('Result')
        .where('id', resultId)
        .pluck('deviceId')

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
      // const issueId = issues[0].id
    }))
})
