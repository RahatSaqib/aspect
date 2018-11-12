const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const setMilliseconds = require('date-fns/set_milliseconds')
const { createGxAlertTestContext } = require('../geneXpert/gxalert_utils')
const { postToDeviceApi } = require('../utils')
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
  resultModuleReplaced,
} = require('../../../src/result/actions')
const { inventoryReagentHealth } = require('../../../src/inventory/actions')
const { resolveIssues } = require('../../../src/issue/actions')
const {
  waitForIdle,
  waitForAction,
  dispatchAndWaitForAction,
} = require('../../utils/mqUtils')

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

  it('should create a module temperature issue and resolve on TC Not met', () =>
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

      let moduleTempErrorIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModuleTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          moduleTempErrorIssueId = issues[0].id
        }
      }

      await dispatchAndWaitForAction(resolveIssues(moduleTempErrorIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, moduleTempErrorIssueId)
      )

      // Update ended on for initial issue to past so module failure issue is resolved
      const errorTestResultId = 'UNIQUE-ID-WITH-TEMP-ERROR-0'
      const testStartedOn = setMilliseconds(subDays(now, 33), 0)
      const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
      const payload = _.merge({}, basicDevicePayload, basicResultPayload, {
        result: {
          id: errorTestResultId,
          startedOn: testStartedOn,
          endedOn: testEndedOn,
        },
      })
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })
      await dispatchAndWaitForAction(resolveIssues(moduleTempErrorIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, moduleTempErrorIssueId)
      )
    }))

  it('should create a module temperature issue and resolve on module change', () =>
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

      let moduleTempErrorIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModuleTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          moduleTempErrorIssueId = issues[0].id
        }
      }

      const errorTestResultId = `UNIQUE-ID-WITH-TEMP-ERROR-X`
      const sampleId = `TEM2542552X`
      const moduleSerial = `MOD98765-X`
      const instrumentSerial = `CEPH-PC-123X`
      const testStartedOn = setMilliseconds(subDays(now, 2), 0)
      const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
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

      // Post the result to aspect
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })

      await waitForIdle()
      await dispatchAndWaitForAction(resolveIssues(moduleTempErrorIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, moduleTempErrorIssueId)
      )
    }))

  it('should create a module temperature issue and resolve on Machine temp error', () =>
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

      let moduleTempErrorIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModuleTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          moduleTempErrorIssueId = issues[0].id
        }
      }

      await dispatchAndWaitForAction(resolveIssues(moduleTempErrorIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, moduleTempErrorIssueId)
      )

      let machineTempErrorIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 2)
          assert.equal(issues[0].issueType, 'ModuleTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          assert.equal(issues[1].issueType, 'MachineTemperatureError')
          assert.equal(issues[1].deviceId, deviceId)
          assert.equal(issues[1].issueStatus, 'Active')
          machineTempErrorIssueId = issues[1].id
        }
      }

      await dispatchAndWaitForAction(resolveIssues(moduleTempErrorIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, moduleTempErrorIssueId)
      )

      await dispatchAndWaitForAction(resolveIssues(machineTempErrorIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, machineTempErrorIssueId)
      )
    }))

  it('should create a machine temperature issue and resolve when under percent', () =>
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
      let machineTempErrorIssueId = null
      for (let i = 0; i < 12; i++) {
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
        if (i === 8) {
          // Should create issue when errors === 8
          const waitForMachineTemperatureError = waitForAction(
            resultMachineTemperatureError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForMachineTemperatureError
          await waitForIdle()
        } else {
          // Post the result to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        }

        const issues = await getIssuesByDeviceId(knex, deviceId)
        if (i < 8) {
          // should not have issue prior to temp error
          assert.equal(issues.length, 0)
        } else {
          // should have only one active issue after 8
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'MachineTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          machineTempErrorIssueId = issues[0].id
        }
      }

      const last30day = subDays(now, 30)
      for (let i = 0; i < 12; i++) {
        /* eslint-disable no-await-in-loop */
        // Update ended on for initial issue to past so module failure issue is resolved
        const results = await knex('Result as r')
          .where('r.deviceId', deviceId)
          .where('r.endedOn', '>=', last30day)
          .whereNotNull('r.errorCode')
          .orderBy('r.id')
          .select('r.id')
        assert.equal(results.length, 12 - i)
        await knex('Result')
          .where({ id: results[0].id })
          .update({ errorCode: null })

        // Should resolve when result count under 1%
        await dispatchAndWaitForAction(resolveIssues(machineTempErrorIssueId))
        assert.equal(
          i < 11 ? 'Active' : 'Resolved',
          await getIssueStatusByIssueId(knex, machineTempErrorIssueId)
        )
      }
    }))

  it('should create a machine temperature issue and resolve when a module is swapped and errors on new modules are under the required percentage', () =>
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
      let machineTempErrorIssueId = null
      for (let i = 0; i < 10; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-MTEMP-ERROR-${i}`
        const sampleId = `MTEMP2542552${i}`
        const moduleSerial = `MTEMP1234${i % 3}`
        const moduleName = `Module A-${i % 3}`
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
        if (i === 8) {
          // Should create issue when errors === 8
          const waitForMachineTemperatureError = waitForAction(
            resultMachineTemperatureError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForMachineTemperatureError
          await waitForIdle()
        } else {
          // Post the result to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        }

        const issues = await getIssuesByDeviceId(knex, deviceId)
        if (i < 8) {
          // should not have issue prior to temp error
          assert.equal(issues.length, 0)
        } else {
          // should have only one active issue after 8
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'MachineTemperatureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          machineTempErrorIssueId = issues[0].id
        }
      }

      // replace all three modules
      for (let i = 0; i < 3; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-MTEMP-ERROR-X-${i}`
        const sampleId = `MTEMP2542552-X-${i}`
        const moduleSerial = `MTEMP1234-X-${i}`
        const moduleName = `Module A-${i}`
        const instrumentSerial = `CEPH-PC-123${i}`
        const testStartedOn = setMilliseconds(subDays(now, i + 2), 0)
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

        // Post the result to aspect
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload,
        })
      }

      await waitForIdle()

      // Should resolve because modules were replaced
      await dispatchAndWaitForAction(resolveIssues(machineTempErrorIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, machineTempErrorIssueId)
      )
    }))

  it('should create a module power issue and resolve when TC no longer met', () =>
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
      let modulePowerErrorIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModulePowerError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          modulePowerErrorIssueId = issues[0].id
        }
      }

      await dispatchAndWaitForAction(resolveIssues(modulePowerErrorIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, modulePowerErrorIssueId)
      )

      // Update ended on for initial issue to past so module power issue is resolved
      const errorTestResultId = 'UNIQUE-ID-WITH-POWER-ERROR-0'
      const testStartedOn = setMilliseconds(subDays(now, 33), 0)
      const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
      const payload = _.merge({}, basicDevicePayload, basicResultPayload, {
        result: {
          id: errorTestResultId,
          startedOn: testStartedOn,
          endedOn: testEndedOn,
        },
      })
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })
      await dispatchAndWaitForAction(resolveIssues(modulePowerErrorIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, modulePowerErrorIssueId)
      )
    }))

  it('should create a module power issue and resolve when Machine power issue', () =>
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
      let modulePowerErrorIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModulePowerError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          modulePowerErrorIssueId = issues[0].id
        }
      }

      await dispatchAndWaitForAction(resolveIssues(modulePowerErrorIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, modulePowerErrorIssueId)
      )

      let machinePowerErrorIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 2)
          assert.equal(issues[0].issueType, 'ModulePowerError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          assert.equal(issues[1].issueType, 'MachinePowerError')
          assert.equal(issues[1].deviceId, deviceId)
          assert.equal(issues[1].issueStatus, 'Active')
          machinePowerErrorIssueId = issues[1].id
        }
      }
      await dispatchAndWaitForAction(resolveIssues(machinePowerErrorIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, machinePowerErrorIssueId)
      )
      await dispatchAndWaitForAction(resolveIssues(modulePowerErrorIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, modulePowerErrorIssueId)
      )
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
      let moduleFailureIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModuleFailureError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          moduleFailureIssueId = issues[0].id
        }
      }

      await dispatchAndWaitForAction(resolveIssues(moduleFailureIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, moduleFailureIssueId)
      )

      // Update ended on for initial issue to past so module failure issue is resolved
      const errorTestResultId = 'UNIQUE-ID-WITH-FAILURE-ERROR-0'
      const testStartedOn = setMilliseconds(subDays(now, 33), 0)
      const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
      const payload = _.merge({}, basicDevicePayload, basicResultPayload, {
        result: {
          id: errorTestResultId,
          startedOn: testStartedOn,
          endedOn: testEndedOn,
        },
      })
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })
      await dispatchAndWaitForAction(resolveIssues(moduleFailureIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, moduleFailureIssueId)
      )
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
      let moduleProceduralErrorIssueId = null
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
        // minErrorsForLUGenericModuleIssue = 6, see src/plugin/partner/Myanmar/onResultLogged.js,
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
            .whereNot('it.externalId', 'ModuleReplaced')
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
          moduleProceduralErrorIssueId = issues[0].id
        }
      }

      const last30day = subDays(now, 30)
      for (let i = 0; i < 7; i++) {
        /* eslint-disable no-await-in-loop */
        // Update ended on for initial issue to past so module failure issue is resolved
        const results = await knex('Result as r')
          .where('r.deviceId', deviceId)
          .where('r.endedOn', '>=', last30day)
          .whereNotNull('r.errorCode')
          .orderBy('r.id')
          .select('r.id')
        assert.equal(results.length, 7 - i)
        await knex('Result')
          .where({ id: results[0].id })
          .update({ errorCode: null })

        // Should resolve when result count under 3%
        await dispatchAndWaitForAction(
          resolveIssues(moduleProceduralErrorIssueId)
        )
        assert.equal(
          i < 6 ? 'Active' : 'Resolved',
          await getIssueStatusByIssueId(knex, moduleProceduralErrorIssueId)
        )
      }
    }))

  it('should create a procedural machine issue ', () =>
    runTest(async knex => {
      const { now } = context

      // Post to deviceApi to ensure the device is in Aspect
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
              name: 'A2',
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
            .whereNot('it.externalId', 'ModuleReplaced')
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

  it('should create a machine procedural issue and resolve when under 3 percent', () =>
    runTest(async knex => {
      const { now } = context
      const errorCode = '1098'

      // Post to deviceApi to ensure the device in in Aspect
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      const deviceId = response.body.device.id
      let machineProceduralErrorIssueId = null
      for (let i = 0; i < 12; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-MPROC-ERROR-${i}`
        const sampleId = `MPROC2542552${i}`
        const moduleSerial = `MPROC1234${i}`
        const moduleName = `Module A-${i}`
        const instrumentSerial = `CEPH-PC-397${i}`
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
        if (i === 8) {
          // Should create issue when errors === 8
          const waitForMachineProceduralError = waitForAction(
            resultMachineProceduralError(deviceId)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForMachineProceduralError
          await waitForIdle()
        } else {
          // Post the result to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        }

        const issues = await getIssuesByDeviceId(knex, deviceId)
        if (i < 8) {
          // should not have issue prior to temp error
          assert.equal(issues.length, 0)
        } else {
          // should have only one active issue after 8
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'MachineProceduralError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          machineProceduralErrorIssueId = issues[0].id
        }
      }

      const last30day = subDays(now, 30)
      for (let i = 0; i < 12; i++) {
        /* eslint-disable no-await-in-loop */
        // Update ended on for initial issue to past so module failure issue is resolved
        const results = await knex('Result as r')
          .where('r.deviceId', deviceId)
          .where('r.endedOn', '>=', last30day)
          .whereNotNull('r.errorCode')
          .orderBy('r.id')
          .select('r.id')
        assert.equal(results.length, 12 - i)
        await knex('Result')
          .where({ id: results[0].id })
          .update({ errorCode: null })

        // Should resolve when result count under 3%
        await dispatchAndWaitForAction(
          resolveIssues(machineProceduralErrorIssueId)
        )
        assert.equal(
          i < 11 ? 'Active' : 'Resolved',
          await getIssueStatusByIssueId(knex, machineProceduralErrorIssueId)
        )
      }
    }))

  describe('should create a machine power issue and resolve when under percent', () => {
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
        let machinePowerErrorIssueId = null
        for (let i = 0; i < 12; i++) {
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

          if (i === 8) {
            // Should create issue when errors === 8
            const waitForMachinePowerError = waitForAction(
              resultMachinePowerError(deviceId)
            )
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload,
            })
            await waitForMachinePowerError
            await waitForIdle()
          } else {
            // Post the result to aspect
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload,
            })
          }

          const issues = await getIssuesByDeviceId(knex, deviceId)
          if (i < 8) {
            // should not have issue prior to temp error
            assert.equal(issues.length, 0)
          } else {
            // should have only one active issue after 8
            assert.equal(issues.length, 1)
            assert.equal(issues[0].issueType, 'MachinePowerError')
            assert.equal(issues[0].deviceId, deviceId)
            assert.equal(issues[0].issueStatus, 'Active')
            machinePowerErrorIssueId = issues[0].id
          }
        }

        await dispatchAndWaitForAction(resolveIssues(machinePowerErrorIssueId))
        assert.equal(
          'Active',
          await getIssueStatusByIssueId(knex, machinePowerErrorIssueId)
        )

        const last30day = subDays(now, 30)
        for (let i = 0; i < 12; i++) {
          /* eslint-disable no-await-in-loop */
          // Update ended on for initial issue to past so module failure issue is resolved
          const results = await knex('Result as r')
            .where('r.deviceId', deviceId)
            .where('r.endedOn', '>=', last30day)
            .whereNotNull('r.errorCode')
            .orderBy('r.id')
            .select('r.id')
          assert.equal(results.length, 12 - i)
          await knex('Result')
            .where({ id: results[0].id })
            .update({ errorCode: null })

          // Should resolve when result count under 1%
          await dispatchAndWaitForAction(
            resolveIssues(machinePowerErrorIssueId)
          )
          assert.equal(
            i < 11 ? 'Active' : 'Resolved',
            await getIssueStatusByIssueId(knex, machinePowerErrorIssueId)
          )
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
      let reagentHealthIssueId = null
      for (let i = 0; i < 8; i++) {
        /* eslint-disable no-await-in-loop */
        const errorTestResultId = `UNIQUE-ID-WITH-REAGENT-HEALTH-ERROR-${i}`
        const sampleId = `REAGENT2552${i}`
        const moduleSerial = `REAGENT1234`
        const instrumentSerial = `CEPH-PC-123${i}`
        const testStartedOn = setMilliseconds(subDays(now, i + 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, i + 2), 0)

        // Post 8 results with error code
        const result = {
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

        const payload = _.merge(
          {},
          basicDevicePayload,
          { name: deviceName },
          basicResultPayload,
          {
            result,
          }
        )
        if (i < 7) {
          // Post first 7 results to aspect
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
        } else {
          // 8th error result should create issue
          const waitForModuleGenericError = waitForAction(
            inventoryReagentHealth(deviceId, 2)
          )
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload,
          })
          await waitForModuleGenericError
          await waitForIdle()

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ReagentHealthError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          reagentHealthIssueId = issues[0].id
        }
      }
      await dispatchAndWaitForAction(resolveIssues(reagentHealthIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, reagentHealthIssueId)
      )

      const { errorResultId } = await knex('Result as r')
        .where('r.errorCode', '2037')
        .orderBy('r.id', 'desc')
        .first('r.id as errorResultId')
      assert.isOk(errorResultId)
      await knex('Result')
        .where({
          id: errorResultId,
        })
        .update({
          errorCode: null,
        })

      await dispatchAndWaitForAction(resolveIssues(reagentHealthIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, reagentHealthIssueId)
      )
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
      let reagentHealthIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ReagentHealthError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          reagentHealthIssueId = issues[0].id
        }
      }
      await dispatchAndWaitForAction(resolveIssues(reagentHealthIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, reagentHealthIssueId)
      )

      const { invalidResultId } = await knex('Result as r')
        .join('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
        .where('rc.externalId', 'Invalid')
        .orderBy('r.id', 'desc')
        .first('r.id as invalidResultId')
      assert.isOk(invalidResultId)
      await knex('Result')
        .where({
          id: invalidResultId,
        })
        .update({
          resultCategory1: knex('ResultCategory')
            .where({ externalId: 'Success' })
            .first('id'),
        })

      await dispatchAndWaitForAction(resolveIssues(reagentHealthIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, reagentHealthIssueId)
      )
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
      let reagentHealthIssueId = null
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ReagentHealthError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          reagentHealthIssueId = issues[0].id
        }
      }
      await dispatchAndWaitForAction(resolveIssues(reagentHealthIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, reagentHealthIssueId)
      )

      const { invalidResultId } = await knex('Result as r')
        .join('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
        .where('rc.externalId', 'Invalid')
        .orderBy('r.id', 'desc')
        .first('r.id as invalidResultId')
      assert.isOk(invalidResultId)
      await knex('Result')
        .where({
          id: invalidResultId,
        })
        .update({
          resultCategory1: knex('ResultCategory')
            .where({ externalId: 'Success' })
            .first('id'),
        })

      await dispatchAndWaitForAction(resolveIssues(reagentHealthIssueId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, reagentHealthIssueId)
      )
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
      let moduleUnknownErrorId = null
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
              name: 'B1',
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

          const issues = await getIssuesByDeviceId(knex, deviceId)
          assert.equal(issues.length, 1)
          assert.equal(issues[0].issueType, 'ModuleUnknownError')
          assert.equal(issues[0].deviceId, deviceId)
          assert.equal(issues[0].issueStatus, 'Active')
          moduleUnknownErrorId = issues[0].id
        }
      }

      await dispatchAndWaitForAction(resolveIssues(moduleUnknownErrorId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, moduleUnknownErrorId)
      )

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

      const issues = await getIssuesByDeviceId(knex, deviceId)
      assert.equal(issues.length, 2)
      let machineUnknownErrorId = null
      issues.forEach(issue => {
        if (issue.issueType === 'MachineUnknownError') {
          assert.equal(issue.deviceId, deviceId)
          assert.equal(issue.issueStatus, 'Active')
          machineUnknownErrorId = issue.id
        }
      })

      await dispatchAndWaitForAction(resolveIssues(moduleUnknownErrorId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, moduleUnknownErrorId)
      )
      await dispatchAndWaitForAction(resolveIssues(machineUnknownErrorId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, machineUnknownErrorId)
      )

      const { machineResultId } = await knex('Result as r')
        .where('r.deviceId', deviceId)
        .where('r.moduleName', 'A1')
        .whereNull('r.errorCode')
        .orderBy('r.id', 'desc')
        .first('r.id as machineResultId')

      assert.isOk(machineResultId)
      await knex('Result')
        .where({ id: machineResultId })
        .update({ errorCode: '1' })

      await dispatchAndWaitForAction(resolveIssues(moduleUnknownErrorId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, moduleUnknownErrorId)
      )
      await dispatchAndWaitForAction(resolveIssues(machineUnknownErrorId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, machineUnknownErrorId)
      )

      const { moduleResultId } = await knex('Result as r')
        .where('r.deviceId', deviceId)
        .where('r.moduleName', 'B1')
        .whereNull('r.errorCode')
        .orderBy('r.id', 'desc')
        .first('r.id as moduleResultId')

      assert.isOk(moduleResultId)
      await knex('Result')
        .where({ id: moduleResultId })
        .update({ errorCode: '1' })

      await dispatchAndWaitForAction(resolveIssues(moduleUnknownErrorId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, moduleUnknownErrorId)
      )
      await dispatchAndWaitForAction(resolveIssues(machineUnknownErrorId))
      assert.equal(
        'Resolved',
        await getIssueStatusByIssueId(knex, machineUnknownErrorId)
      )
    }))

  it('should create a module replaced issue when a new serial is detected in a slot', () =>
    runTest(async knex => {
      const { now } = context

      // Post to deviceApi to ensure the device in in Aspect
      let response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      const deviceId = response.body.device.id

      // Post one result to slot A1
      let resultId = `UNIQUE-ID-1`
      let sampleId = `GENMAC25521`
      let moduleSerial = `GENMAC123A`
      let instrumentSerial = `CEPH-PC-123`
      let testStartedOn = setMilliseconds(subDays(now, 3), 0)
      let testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

      let result = {
        id: resultId,
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

      let payload = _.merge(
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

      // Post another result with same module serial to the same slot
      let moduleReplacedIssueId = null
      resultId = `UNIQUE-ID-3`
      sampleId = `GENMAC25B3`
      moduleSerial = `GENMAC123B`
      instrumentSerial = `CEPH-PC-123`
      testStartedOn = setMilliseconds(subDays(now, 1), 0)
      testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

      // Post the result with the new module serial
      result = {
        id: resultId,
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

      payload = _.merge(
        {},
        basicDevicePayload,
        { name: deviceName },
        basicResultPayload,
        {
          result,
        }
      )

      resultId = `UNIQUE-ID-2`
      sampleId = `GENMAC25B2`
      moduleSerial = `GENMAC123B`
      instrumentSerial = `CEPH-PC-123`
      testStartedOn = setMilliseconds(subDays(now, 2), 0)
      testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

      // Post the result with the new module serial
      result = {
        id: resultId,
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

      payload = _.merge(
        {},
        basicDevicePayload,
        { name: deviceName },
        basicResultPayload,
        {
          result,
        }
      )

      // Should create one module replaced issue
      response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })

      const waitForModuleReplacedIssue = waitForAction(
        resultModuleReplaced(response.body.result.id)
      )
      await waitForModuleReplacedIssue
      await waitForIdle()

      const issues = await getIssuesByDeviceId(knex, deviceId)
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'ModuleReplaced')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
      moduleReplacedIssueId = issues[0].id

      await dispatchAndWaitForAction(resolveIssues(moduleReplacedIssueId))
      assert.equal(
        'Active',
        await getIssueStatusByIssueId(knex, moduleReplacedIssueId)
      )
    }))

  it('should NOT create a module replaced issue when a new serial is detected in a different slot', () =>
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

      // Post one result to slot A1
      let resultId = `UNIQUE-ID-1`
      let sampleId = `GENMAC25521`
      let moduleSerial = `GENMAC123A`
      let instrumentSerial = `CEPH-PC-123`
      let testStartedOn = setMilliseconds(subDays(now, 3), 0)
      let testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

      let result = {
        id: resultId,
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

      let payload = _.merge(
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

      // Post one result with a different module serial to the same slot
      resultId = `UNIQUE-ID-2`
      sampleId = `GENMAC25B2`
      moduleSerial = `GENMAC123B`
      instrumentSerial = `CEPH-PC-123`
      testStartedOn = setMilliseconds(subDays(now, 2), 0)
      testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

      // Post the result with the new module serial
      result = {
        id: resultId,
        startedOn: testStartedOn,
        endedOn: testEndedOn,
        sample: { id: sampleId },
        instrument: {
          serial: instrumentSerial,
          module: {
            serial: moduleSerial,
            name: 'B2',
          },
        },
      }

      payload = _.merge(
        {},
        basicDevicePayload,
        { name: deviceName },
        basicResultPayload,
        {
          result,
        }
      )

      // Should NOT create module replaced issue
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })
      await waitForIdle()

      const issues = await getIssuesByDeviceId(knex, deviceId)
      assert.equal(issues.length, 0)
    }))

  it('should NOT create a module replaced issue when the same serial is detected in a slot', () =>
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

      // Post one result to slot A1
      let resultId = `UNIQUE-ID-1`
      let sampleId = `GENMAC25521`
      const moduleSerial = `GENMAC123A`
      let instrumentSerial = `CEPH-PC-123`
      let testStartedOn = setMilliseconds(subDays(now, 3), 0)
      let testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

      let result = {
        id: resultId,
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

      let payload = _.merge(
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

      // Post one result with a different module serial to the same slot
      resultId = `UNIQUE-ID-2`
      sampleId = `GENMAC25B2`
      instrumentSerial = `CEPH-PC-123`
      testStartedOn = setMilliseconds(subDays(now, 2), 0)
      testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

      // Post the result with the new module serial
      result = {
        id: resultId,
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

      payload = _.merge(
        {},
        basicDevicePayload,
        { name: deviceName },
        basicResultPayload,
        {
          result,
        }
      )

      // Should NOT create module replaced issue
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload,
      })
      await waitForIdle()

      const issues = await getIssuesByDeviceId(knex, deviceId)
      assert.equal(issues.length, 0)
    }))
})

async function getIssuesByDeviceId(knex, deviceId) {
  return knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'i.deviceId': deviceId })
    .orderBy('i.id')
    .select(
      'i.id',
      'it.externalId as issueType',
      'i.deviceId',
      'is.externalId as issueStatus'
    )
}

async function getIssueStatusByIssueId(knex, issueId) {
  assert.isOk(issueId)
  const issue = await knex('Issue as i')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'i.id': issueId })
    .first('is.externalId as issueStatus')
  assert.isOk(issue)
  assert.isOk(issue.issueStatus)
  return issue.issueStatus
}
