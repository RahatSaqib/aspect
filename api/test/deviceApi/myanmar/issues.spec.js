const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const setMilliseconds = require('date-fns/set_milliseconds')
const { createGxAlertTestContext } = require('../geneXpert/gxalert_utils')
const { postToDeviceApi } = require('../geneXpert/utils')
const { basicResultPayload } = require('../geneXpert/geneXpertConstants')
const { run } = require('../../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const {
  resultModuleTemperatureError,
  resultModulePowerError,
  resultModuleFailureError,
  resultMachineTemperatureError,
  resultMachineProceduralError,
  resultModuleProceduralError,
  resultMachinePowerError,
  resultModuleUnknownError,
  resultMachineUnknownError,
} = require('../../../src/result/actions')
const { inventoryReagentHealth } = require('../../../src/inventory/actions')
const { waitForIdle, waitForAction } = require('../../utils/mqUtils')

const startOfMonth = require('date-fns/start_of_month')
const endOfMonth = require('date-fns/end_of_month')
const subMonths = require('date-fns/sub_months')
const startOfQuarter = require('date-fns/start_of_quarter')
const endOfQuarter = require('date-fns/end_of_quarter')
const subQuarters = require('date-fns/sub_quarters')
const startOfYear = require('date-fns/start_of_year')

describe('Myanmar Issue endpoints', () => {
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
      await beforeCreateGxAlertApiKey({
        countryAbbreviation: 'MM',
        partnerName: 'Myanmar',
      })
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

      // This won't create any issue since (1/20 * 100)% <= 5%
      for (let i = 0; i < 21; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-GEN-MAC-ERROR-${i}`
        const sampleId = `GENMAC2552${i}`
        const moduleSerial = `GENMAC123A`
        const instrumentSerial = `CEPH-PC-123`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few results without an error code
        const result = {
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
        if (i > 19) {
          result.error = {
            code: '1096',
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
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload,
        })
      }

      // Should now create a procedural module issue
      for (let i = 0; i < 10; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-GEN-MOD-ERROR-${i}`
        const sampleId = `GENMOD2552${i}`
        const moduleSerial = `GENMOD1234`
        const instrumentSerial = `CEPH-PC-123`
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
        // 6 errors (i=4..9)
        if (i > 3) {
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
        // minErrorsForLUGenericModuleIssue = 6, see src/deviceApi/plugins/myanmar/onResultLogged.js,
        if (i < 9) {
          // Post the result to aspect - 5 error results (i=4..8) do not trigger Module issue
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        } else {
          // Should create issue when errorCode is added
          const waitForModuleProceduralError = waitForAction(
            resultModuleProceduralError(deviceId)
          )
          // 6-th error result (i=9) will trigger Module issue
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

  it('should create a procedural machine issue ', () =>
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

      // Module A: This won't create any issue since (1/20 * 100)% !> 5%
      for (let i = 0; i < 21; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-GEN-MAC-ERROR-${i}`
        const sampleId = `GENMAC2552${i}`
        const moduleSerial = `GENMAC123A`
        const instrumentSerial = `CEPH-PC-123`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few results without an error code
        const result = {
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
        if (i > 19) {
          result.error = {
            code: '1096',
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
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload,
        })
      }

      // Module B: should create a module procedural issue (1/10 * 100)% > 5%
      for (let i = 0; i < 10; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-GEN-MAC-B-ERR-${i}`
        const sampleId = `GENMAC25B${i}`
        const moduleSerial = `GENMAC123B`
        const instrumentSerial = `CEPH-PC-456`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few results without an error code
        const result = {
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
        // 6 errors (i=4..9)
        if (i > 3) {
          result.error = {
            code: '1096',
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
          // Post the result to aspect - 5 error results (i=4..8) do not trigger Module issue
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        } else {
          // Should create issue when errorCode is added
          const waitForModuleProceduralError = waitForAction(
            resultModuleProceduralError(deviceId)
          )
          // 6-th error result (i=9) will trigger Module issue
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

      // Post an additional result with procedural error to to module A
      const testStartedOn = setMilliseconds(subDays(now, 22 + 3), 0)
      const result = {
        id: 'UNIQUE-ID-WITH-GEN-MAC-ERROR-22',
        startedOn: testStartedOn,
        endedOn: setMilliseconds(addHours(testStartedOn, 22 + 2), 0),
        sample: { id: 'GENMODB55222' },
        error: {
          code: '1096',
        },
        instrument: {
          serial: 'CEPH-PC-123',
          module: {
            serial: 'GENMAC123A',
            name: 'A1',
          },
        },
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
      // Should create issue when errorCode is added
      const waitForMachineProceduralError = waitForAction(
        resultMachineProceduralError(deviceId)
      )
      // so, there are 6 errors in previous (2nd) module,
      // and here we add 2nd error to the 1st module - totally we have now 8 errors - this triggers Machine issue
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })
      await waitForMachineProceduralError
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
      assert.equal(issues.length, 2)
      issues.forEach(issue => {
        if (issue.issueType === 'MachineProceduralError') {
          assert.equal(issue.deviceId, deviceId)
          assert.equal(issue.issueStatus, 'Active')
        }
      })
      // TOD0 - Add tests to ensure the the module issue is removed when
      // the procedural machine issue is created
    }))

  describe('should create a machine power issue when ', () => {
    beforeEach(async () =>
      run(async () => {
        await beforeCreateGxAlertApiKey({
          countryAbbreviation: 'MM',
          partnerName: 'Myanmar',
        })
        useGxAlertDeviceId(gxAlertDeviceId)
        ;({ deviceAuth } = context)
      })
    )
    afterEach(afterCleanUp)

    it('the number of power-specific errors across all modules is greater than 8 ', () =>
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

    it('the percentage of results with result category of NoResult is greater 3% ', () =>
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
          // 8 NoResult entries (i=3..10)
          if (i > 2) {
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
            // Should create issue when errors >= 8
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

  it('should create a reagent health issue when errors exceed', () =>
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
        const errorTestResultId = `UNIQUE-ID-WITH-REAGENT-HEALTH-ERROR-${i}`
        const sampleId = `REAGENT2552${i}`
        const moduleSerial = `REAGENT1234`
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
              code: '2037',
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
          const waitForModuleGenericError = waitForAction(
            inventoryReagentHealth(deviceId, 2)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleGenericError
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
          assert.equal(issues[0].issueType, 'ReagentHealthError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))

  it('should create a reagent health issue when invalid result exceed', () =>
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
        const errorTestResultId = `UNIQUE-ID-WITH-REAGENT-HEALTH-ERROR-${i}`
        const sampleId = `REAGENT2552${i}`
        const moduleSerial = `REAGENT1234`
        const instrumentSerial = `CEPH-PC-123${i}`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few valid results
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
            category: [{ id: 'Invalid' }],
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
          const waitForModuleGenericError = waitForAction(
            inventoryReagentHealth(deviceId, 2)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleGenericError
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
          assert.equal(issues[0].issueType, 'ReagentHealthError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))

  it('should create a reagent health issue when a single batch invalid result exceed', () =>
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
        const errorTestResultId = `UNIQUE-ID-WITH-REAGENT-HEALTH-ERROR-${i}`
        const sampleId = `REAGENT2552${i}`
        const moduleSerial = `REAGENT1234`
        const instrumentSerial = `CEPH-PC-123${i}`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few valid results
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
          consumable: {
            lot: 'Lot A',
          },
        }
        if (i > 8) {
          result = {
            id: errorTestResultId,
            startedOn: testStartedOn,
            endedOn: testEndedOn,
            category: [{ id: 'Invalid' }],
            sample: { id: sampleId },
            instrument: {
              serial: instrumentSerial,
              module: {
                serial: moduleSerial,
                name: 'A1',
              },
            },
            consumable: {
              lot: 'Lot A',
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
          const waitForModuleGenericError = waitForAction(
            inventoryReagentHealth(deviceId, 2)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleGenericError
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
          assert.equal(issues[0].issueType, 'ReagentHealthError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }
    }))

  it('should create a module and machine "Unknown Error" issues', () =>
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

      // Module A: This won't create any issue since (1/20 * 100)% !> 5%
      for (let i = 0; i < 21; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-GEN-MAC-ERROR-${i}`
        const sampleId = `GENMAC2552${i}`
        const moduleSerial = `GENMAC123A`
        const instrumentSerial = `CEPH-PC-123`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few results without an error code
        const result = {
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
        if (i > 19) {
          result.data = {
            resultText: 'ERROR',
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
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload,
        })
      }

      // Module B: should create a module UnknownError issue (1/10 * 100)% > 5%
      for (let i = 0; i < 10; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-GEN-MAC-B-ERR-${i}`
        const sampleId = `GENMAC25B${i}`
        const moduleSerial = `GENMAC123B`
        const instrumentSerial = `CEPH-PC-456`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post the first few results without an error code
        const result = {
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
        if (i > 3) {
          result.data = {
            resultText: 'ERROR',
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
          // Should create issue
          const waitForModuleUnknownError = waitForAction(
            resultModuleUnknownError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleUnknownError
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
          assert.equal(issues[0].issueType, 'ModuleUnknownError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
        }
      }

      // Post an additional result with procedural error to to module A
      const testStartedOn = setMilliseconds(subDays(now, 22 + 3), 0)
      const result = {
        id: 'UNIQUE-ID-WITH-GEN-MAC-ERROR-22',
        startedOn: testStartedOn,
        endedOn: setMilliseconds(addHours(testStartedOn, 22 + 2), 0),
        sample: { id: 'GENMODB55222' },
        data: {
          resultText: 'ERROR',
        },
        instrument: {
          serial: 'CEPH-PC-123',
          module: {
            serial: 'GENMAC123A',
            name: 'A1',
          },
        },
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
      // Should create issue when errorCode is added
      const waitForMachineUnknownError = waitForAction(
        resultMachineUnknownError(deviceId)
      )
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })
      await waitForMachineUnknownError
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
      assert.equal(issues.length, 2)
      issues.forEach(issue => {
        if (issue.issueType === 'MachineUnknownError') {
          assert.equal(issue.deviceId, deviceId)
          assert.equal(issue.issueStatus, 'Active')
        }
      })
    }))

  it('should create a DataCategoryLow issue ', () =>
    runTest(async knex => {
      const now = new Date()
      const addPeriod = (name, dateFrom, dateTo) => ({ name, dateFrom, dateTo })
      const periods = [
        addPeriod('Current Month', startOfMonth(now), now),
        addPeriod(
          'Last Month',
          startOfMonth(subMonths(now, 1)),
          endOfMonth(subMonths(now, 1))
        ),
        addPeriod('Current Quarter', startOfQuarter(now), now),
        addPeriod(
          'Last Quarter',
          startOfQuarter(subQuarters(now, 1)),
          endOfQuarter(subQuarters(now, 1))
        ),
        addPeriod('This Year', startOfYear(now), now),
      ]

      const { id: partnerId } = await knex('Partner')
        .where({ name: 'Myanmar' })
        .first()
      // read all data categories for current partner
      const dataCategories = await knex('DataCategory').where({ partnerId })
      const triggeredBySiteOnThisRound = {}

      // check data categories for having 'low status'
      await Promise.all(
        _.map(dataCategories, async dataCategory => {
          const validValues =
            dataCategory.validValues && JSON.parse(dataCategory.validValues)

          const { partnerId, externalId: category } = dataCategory

          // get all sites for current partnerId
          const sites = await knex('Site')
            .where({ partnerId })
            .select('id', 'name', 'geographyId')

          await Promise.all(
            _.map(periods, async period => {
              await Promise.all(
                _.map(sites, async site => {
                  // if issue has already been triggered for current site then exit
                  // this includes all categories - so, if any category triggered an issue then exit and skip
                  // checking other categories
                  if (triggeredBySiteOnThisRound[site.id]) {
                    return
                  }

                  const itemsBase = knex('Result as r')
                    .innerJoin('Device as d', 'r.deviceId', 'd.id')
                    // filter by period
                    .where('r.endedOn', '>=', period.dateFrom)
                    .where('r.endedOn', '<=', period.dateTo)
                    // filter by site
                    .where(function() {
                      // either result is from site's geography
                      this.where(function() {
                        this.whereNotNull('r.geographyId').andWhere(
                          'r.geographyId',
                          site.geographyId
                        )
                      })
                      // or device is from site's geography
                      this.orWhere(function() {
                        this.whereNotNull('d.geographyId')
                          .andWhereRaw(`${site.geographyId || -1} > 0`)
                          .andWhere('d.geographyId', site.geographyId)
                      })
                    })

                  const totals = await itemsBase
                    .clone()
                    .countDistinct('r.id as count')
                  const numValid = await itemsBase
                    .clone()
                    .where(function() {
                      // process 2 main cases - validValues is an array or not
                      if (validValues && _.isArray(validValues)) {
                        // field exists in json
                        this.whereRaw('r.patientData like ?', [
                          `%"${category}":%`,
                        ])
                        this.andWhere(function() {
                          _.each(validValues, value => {
                            this.orWhereRaw(
                              `JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.${category}")) = ?`,
                              [value]
                            )
                          })
                        })
                      } else {
                        const fieldNames = JSON.parse(dataCategory.fieldNames)
                        _.map(fieldNames, field => {
                          // make sure existing value is not "undefined", "null" or ""
                          this.whereRaw(
                            `
                            JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.${field}")) != "undefined"
                            and
                            JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.${field}")) != "null"
                            and
                            JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.${field}")) != ""
                            `
                          )
                        })
                      }
                    })
                    .countDistinct('r.id as count')

                  const percentage =
                    totals[0].count === 0
                      ? 0
                      : 100 * (numValid[0].count / totals[0].count)
console.log('category =', category, 'period =', period.name, 'site =', site.name,'percentage =', percentage, 'valid =', numValid[0].count, 'totals =', totals[0].count)
                  if (percentage < dataCategory.cutoffPercentage) {
                    const payload = {
                      dataCategoryId: dataCategory.id,
                      categoryName: dataCategory.name,
                      periodName: period.name,
                      siteId: site.id,
                      percentage,
                    }
                    // context.factDataCategoryLow(payload)
                    triggeredBySiteOnThisRound[site.id] = true
                  }
                })
              )
            })
          )
        })
      )
    }))
})
