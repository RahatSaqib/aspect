const _ = require('lodash')

const chai = require('chai')
const subDays = require('date-fns/subDays')
const addHours = require('date-fns/addHours')
const setMilliseconds = require('date-fns/setMilliseconds')
const { subYears } = require('date-fns')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { postToDeviceApi } = require('../utils')
const { basicResultPayload } = require('./geneXpertConstants')
const { knex } = require('../../../src/db')

const server = require('../../utils/testUtils')

const { assert } = chai
const { resultModuleReplaced } = require('../../../src/result/actions')

const { waitForIdle, waitForAction } = require('../../utils/mqUtils')

describe('Module Replaced Issue testing', () => {
  const macAddress = 'MAC00000000FAKE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'This Lab Has Results!'

  const context = createGxConnectTestContext(server, {
    countryCode,
    adminUsername,
    adminPassword,
    deviceName,
    macAddress,
  })
  const { beforeRegisterAndSetDevice, basicDevicePayload, afterCleanUp } = context
  let { deviceAuth } = context
  beforeEach(async () => {
    await beforeRegisterAndSetDevice()
    ;({ deviceAuth } = context)
  })

  afterEach(afterCleanUp)
  const now = new Date()
  it('should create a module replaced issue when a new serial is detected in a slot', async () => {
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

    let payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })
    response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload,
    })

    // Post another result with same module serial to the same slot
    resultId = `UNIQUE-ID-3`
    sampleId = `GENMAC25B3`
    moduleSerial = `GENMAC123B`
    instrumentSerial = `CEPH-PC-123`
    testStartedOn = setMilliseconds(subDays(now, 2), 0)
    testEndedOn = setMilliseconds(addHours(testStartedOn, 5), 0)
    const oldResultId = response.body.aspectResultId
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

    payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })

    // Should create one module replaced issue
    response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload,
    })

    let waitForModuleReplacedIssue = waitForAction(resultModuleReplaced(response.body.aspectResultId))
    await waitForModuleReplacedIssue
    await waitForIdle()

    let issues = await getIssuesByDeviceId(knex, deviceId)
    assert.equal(issues.length, 1)
    assert.equal(issues[0].issueType, 'ModuleReplaced')
    assert.equal(issues[0].deviceId, deviceId)
    assert.equal(issues[0].issueStatus, 'Active')
    assert.equal(JSON.parse(issues[0].data).moduleName, 'A1')
    assert.equal(JSON.parse(issues[0].data).newModuleSerial, 'GENMAC123B')
    assert.equal(JSON.parse(issues[0].data).replacedModuleSerial, 'GENMAC123A')
    assert.equal(JSON.parse(issues[0].data).oldResultId, oldResultId)

    // the issue already exists so it should not create a new one with an older result.
    payload.result.id = `UNIQUE-ID-4`
    payload.result.sample.id = `GENMAC25B4`
    payload.result.instrument.module.serial = `GENMAC123B`
    payload.result.startedOn = setMilliseconds(subDays(now, 1), 0)
    payload.result.endedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
    response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload,
    })

    waitForModuleReplacedIssue = waitForAction(resultModuleReplaced(response.body.aspectResultId))
    await waitForModuleReplacedIssue
    await waitForIdle()

    issues = await getIssuesByDeviceId(knex, deviceId)
    assert.equal(issues.length, 1)
    assert.equal(issues[0].issueType, 'ModuleReplaced')
    assert.equal(issues[0].deviceId, deviceId)
    assert.equal(issues[0].issueStatus, 'Active')
    assert.equal(JSON.parse(issues[0].data).moduleName, 'A1')
    assert.equal(JSON.parse(issues[0].data).newModuleSerial, 'GENMAC123B')
    assert.equal(JSON.parse(issues[0].data).replacedModuleSerial, 'GENMAC123A')
    assert.equal(JSON.parse(issues[0].data).oldResultId, oldResultId)
  })
  it('should NOT create a module replaced issue when a new serial is detected in a slot and the last message is older than 2 years', async () => {
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
    let testStartedOn = setMilliseconds(subYears(now, 3), 0)
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

    let payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })
    response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload,
    })

    // Post another result with a different module serial to the same slot
    resultId = `UNIQUE-ID-3`
    sampleId = `GENMAC25B3`
    moduleSerial = `GENMAC123B`
    instrumentSerial = `CEPH-PC-123`
    testStartedOn = setMilliseconds(subDays(now, 2), 0)
    testEndedOn = setMilliseconds(addHours(testStartedOn, 5), 0)
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

    payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })

    // Should create one module replaced issue
    response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload,
    })
    await waitForIdle()

    const issues = await getIssuesByDeviceId(knex, deviceId)
    assert.equal(issues.length, 0)
  })
  it('should NOT create a module replaced issue when a new serial is detected in a different slot', async () => {
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

    let payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })
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

    // Post the result with the new module serial AND name
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

    payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })

    // Should NOT create module replaced issue
    await postToDeviceApi({
      authHeader: deviceAuth,
      payload,
    })
    await waitForIdle()

    const issues = await getIssuesByDeviceId(knex, deviceId)
    assert.equal(issues.length, 0)
  })
  it('should NOT create a module replaced issue when a new serial is detected in null module bay', async () => {
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

    let payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })
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

    // Post the result with the new module serial AND name
    result = {
      id: resultId,
      startedOn: testStartedOn,
      endedOn: testEndedOn,
      sample: { id: sampleId },
      instrument: {
        serial: instrumentSerial,
        module: {
          serial: moduleSerial,
        },
      },
    }

    payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })

    // Should NOT create module replaced issue
    await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.omit(payload, 'result.instrument.module'),
    })
    await waitForIdle()

    const issues = await getIssuesByDeviceId(knex, deviceId)
    assert.equal(issues.length, 0)
  })

  it('should NOT create a module replaced issue when the same serial is detected in a slot', async () => {
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

    let payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })
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

    payload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
      result,
    })

    // Should NOT create module replaced issue
    await postToDeviceApi({
      authHeader: deviceAuth,
      payload,
    })
    await waitForIdle()

    const issues = await getIssuesByDeviceId(knex, deviceId)
    assert.equal(issues.length, 0)
  })
})

async function getIssuesByDeviceId(knex, deviceId) {
  return knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'i.deviceId': deviceId })
    .orderBy('i.id')
    .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.data')
}
