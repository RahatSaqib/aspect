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
const {
  resultModuleTemperatureError,
  resultModulePowerError,
  resultModuleFailureError,
  resultMachineTemperatureError,
  resultModuleProceduralError,
  resultMachinePowerError,
} = require('../../../src/result/actions')
const { waitForIdle, waitForAction } = require('../../utils/mqUtils')

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
    afterCleanUp,
  } = context
  let { deviceAuth } = context
  beforeEach(async () =>
    run(async () => {
      await beforeCreateGxAlertApiKey()
      useGxAlertDeviceId(gxAlertDeviceId)
      ;({ deviceAuth } = context)
    })
  )
  afterEach(afterCleanUp)

  it('should create a module temperature issue', () =>
    runTest(async knex => {
      const { now } = context
      const errorCode = '4010'

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
        const errorTestResultId = `UNIQUE-ID-WITH-TEMP-ERROR-${i}`
        const sampleId = `TEM2542552${i}`
        const moduleSerial = `MOD98765`
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

  it('should create a machine temperature issue ', () =>
    runTest(async knex => {
      const { now } = context
      const errorCode = '4010'

      // Post to deviceApi to ensure the device in in Aspect
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      const deviceId = response.body.device.id
      for (let i = 0; i < 9; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-MTEMP-ERROR-${i}`
        const sampleId = `MTEMP2542552${i}`
        const moduleSerial = `MTEMP1234${i}`
        const moduleName = `Module A-${i}`
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
                  name: moduleName,
                },
              },
            },
          }
        )
        if (i < 8) {
          // Post the result to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        } else {
          // Should create issue when errors > 8
          const waitForMachineTemperatureError = waitForAction(
            resultMachineTemperatureError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForMachineTemperatureError
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
          assert.equal(issues[0].issueType, 'MachineTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))

  it('should create a module power issue ', () =>
    runTest(async knex => {
      const { now } = context
      const errorCode = '1007'

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
        const errorTestResultId = `UNIQUE-ID-WITH-POWER-ERROR-${i}`
        const sampleId = `POW2542552${i}`
        const moduleSerial = `POW12345`
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
          const waitForModulePowerError = waitForAction(
            resultModulePowerError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModulePowerError
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
          assert.equal(issues[0].issueType, 'ModulePowerError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))

  it('should create a module failure issue ', () =>
    runTest(async knex => {
      const { now } = context
      const errorCode = '2032'

      // Post to deviceApi to ensure the device in in Aspect
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      const deviceId = response.body.device.id
      for (let i = 0; i < 3; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-FAILURE-ERROR-${i}`
        const sampleId = `FAIL2542552${i}`
        const moduleSerial = `FAIL12345`
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
        if (i < 2) {
          // Post the result to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        } else {
          // Should create issue when errors > 4
          const waitForModuleFailureError = waitForAction(
            resultModuleFailureError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleFailureError
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
          assert.equal(issues[0].issueType, 'ModuleFailureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))

  it('should create a procedural module issue ', () =>
    runTest(async knex => {
      const { now } = context

      // Post to deviceApi to ensure the device in in Aspect
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      const deviceId = response.body.device.id
      for (let i = 0; i < 10; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-GEN-MOD-ERROR-${i}`
        const sampleId = `GENMOD2552${i}`
        const moduleSerial = `GENMOD1234`
        const instrumentSerial = `CEPH-PC-123${i}`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few results without an error code
        let result = {
          id: errorTestResultId,
          startedOn: testStartedOn,
          endedOn: testEndedOn,
          sample: { id: sampleId },
          instrument: {
            serial: instrumentSerial,
            module: {
              serial: moduleSerial,
              name: 'A1',
            },
          },
        }
        if (i > 8) {
          result = {
            id: errorTestResultId,
            startedOn: testStartedOn,
            endedOn: testEndedOn,
            error: {
              code: '1096',
            },
            sample: { id: sampleId },
            instrument: {
              serial: instrumentSerial,
              module: {
                serial: moduleSerial,
                name: 'A1',
              },
            },
          }
        }

        const payload = _.merge(
          {},
          basicDevicePayload,
          { name: deviceName },
          basicResultPayload,
          {
            result,
          }
        )
        if (i < 9) {
          // Post the result to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        } else {
          // Should create issue when errorCode is added
          const waitForModuleProceduralError = waitForAction(
            resultModuleProceduralError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleProceduralError
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
          assert.equal(issues[0].issueType, 'ModuleProceduralError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))
  describe('should create a machine power issue when ', () => {
    beforeEach(async () =>
      run(async () => {
        await beforeCreateGxAlertApiKey()
        useGxAlertDeviceId(gxAlertDeviceId)
        ;({ deviceAuth } = context)
      })
    )
    afterEach(afterCleanUp)

    it('the number of power-specific errors accross all modules is greater than 8 ', () =>
      runTest(async knex => {
        const { now } = context
        const errorCode = '1007'

        // Post to deviceApi to ensure the device in in Aspect
        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
          }),
        })
        const deviceId = response.body.device.id
        for (let i = 0; i < 9; i++) {
          /* eslint-disable no-await-in-loop */
          const errorTestResultId = `UNIQUE-ID-WITH-MPOWER-ERROR-${i}`
          const sampleId = `MPOWER2542552${i}`
          const moduleSerial = `MPOWER1234${i}`
          const moduleName = `Module A-${i}`
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
                    name: moduleName,
                  },
                },
              },
            }
          )
          if (i < 8) {
            // Post the result to aspect
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload,
            })
          } else {
            // Should create issue when errors > 8
            const waitForMachinePowerError = waitForAction(
              resultMachinePowerError(deviceId)
            )
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload,
            })
            await waitForMachinePowerError
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
            assert.equal(issues[0].issueType, 'MachinePowerError')
            assert.equal(issues[0].deviceId, deviceId)
            assert.equal(issues[0].issueStatus, 'Active')
          }
        }
      }))

    it('the percantage of results with result category of NoRusult is greater 3% ', () =>
      runTest(async knex => {
        const { now } = context

        // Post to deviceApi to ensure the device in in Aspect
        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
          }),
        })
        const deviceId = response.body.device.id
        for (let i = 0; i < 11; i++) {
          /* eslint-disable no-await-in-loop */
          const errorTestResultId = `UNIQUE-ID-WITH-MPOWER-ERROR-${i}`
          const sampleId = `MPOWER2542552${i}`
          const moduleSerial = `MPOWER1234${i}`
          const moduleName = `Module A-${i}`
          const instrumentSerial = `CEPH-PC-123${i}`
          const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

          const result = {
            id: errorTestResultId,
            startedOn: testStartedOn,
            endedOn: testEndedOn,
            sample: { id: sampleId },
            instrument: {
              serial: instrumentSerial,
              module: {
                serial: moduleSerial,
                name: moduleName,
              },
            },
          }

          if (i > 9) {
            result.data = {
              resultText: 'NO RESULT',
            }
          }

          const payload = _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result,
            }
          )
          if (i < 10) {
            // Post the result to aspect
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload,
            })
          } else {
            // Should create issue when errors > 8
            const waitForMachinePowerError = waitForAction(
              resultMachinePowerError(deviceId)
            )
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload,
            })
            await waitForMachinePowerError
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
            assert.equal(issues[0].issueType, 'MachinePowerError')
            assert.equal(issues[0].deviceId, deviceId)
            assert.equal(issues[0].issueStatus, 'Active')
          }
        }
      }))
  })
})
