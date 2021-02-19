const _ = require('lodash')

const chai = require('chai')
const subDays = require('date-fns/subDays')
const addHours = require('date-fns/addHours')
const setMilliseconds = require('date-fns/setMilliseconds')
const { createGxAlertTestContext } = require('./gxalert_utils')
const { postToDeviceApi } = require('../utils')
const { basicResultPayload } = require('./geneXpertConstants')
const { knex } = require('../../../src/db')

const server = require('../../utils/testUtils')

const { assert } = chai
const { resultModuleReplaced } = require('../../../src/result/actions')

const { resolveIssues } = require('../../../src/issue/actions')
const {
  waitForIdle,
  waitForAction,
  dispatchAndWaitForAction,
} = require('../../utils/mqUtils')

describe.only('Module Replaced Issue testing', () => {
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
    afterCleanUp,
  } = context
  let { deviceAuth } = context
  beforeEach(async () => {
    await beforeCreateGxAlertApiKey({
      countryAbbreviation: 'US',
      partnerName: 'Partner One',
    })
    useGxAlertDeviceId(gxAlertDeviceId)
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
  })
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
