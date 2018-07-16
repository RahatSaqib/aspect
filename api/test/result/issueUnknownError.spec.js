const _ = require('lodash')
const { addMilliseconds, addMinutes, subMinutes, subDays } = require('date-fns')
const { rowsAsObject } = require('../../seeds/utils')
const patients = require('../../seeds/development/fixtures/patients.json')
const {
  processUsingHandlebarsSyntax,
} = require('../../src/stringTemplate/service')

const now = new Date()
const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 30

const { run } = require('../../src/db')
const {
  resultModuleUnknownError,
  resultMachineUnknownError,
} = require('../../src/result/actions')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
  queuePurge,
} = require('../utils/mqUtils')
const { cleanUpIssues } = require('../utils/issueUtils')

const chai = require('chai')

const { assert } = chai

const USER_LU = 'myanmar_lab1'
const USER_RO = 'myanmar_ro1'

const last30day = subDays(new Date(), 30)
const moduleMaxUnknownErrors = 8
const machineMaxUnknownErrors = 8

// ********************************************
// helper functions
// ********************************************
// -----------------
// insertSampleErrorResultsWithoutErrorCode
// -----------------
async function insertSampleResults(knex, partnerName, adminName) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first()

  const { id: adminId } = await knex('User')
    .where({ name: adminName })
    .first('id')

  const device = await knex('Device')
    .where({ partnerId })
    .whereNotNull('geographyId')
    .whereNotNull('siteId')
    .first()

  const { geographyId, siteId } = device

  const { latitude, longitude } = await knex('Site')
    .where({ id: device.siteId })
    .first()

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [
    assays,
    sampleTypes,
    resultCategories,
    resultSources,
    resultTypes,
    resultWorkflowStatuses,
  ] = await Promise.all([
    rowsAsObject(knex, 'Assay', 'externalId'),
    rowsAsObject(knex, 'SampleType', 'externalId'),
    rowsAsObject(knex, 'ResultCategory', 'externalId'),
    rowsAsObject(knex, 'ResultSource', 'externalId'),
    rowsAsObject(knex, 'ResultType', 'externalId'),
    rowsAsObject(knex, 'ResultWorkflowStatus', 'externalId'),
  ])

  const resultData = {
    probes: {
      probeA: 'NEG',
      probeB: 'POS',
      probeC: 'NO RESULT',
      probeD: 'NEG',
      probeE: 'POS',
      probeSpc: 'NO RESULT',
      qc1: 'YES',
      qc2: 'No',
      probeACt: 12.32,
      probeBCt: 11.2,
      probeCCt: 12.5,
      probeDCt: 0.5,
      probeECt: 1.2,
      probeSpcCt: 5.78,
      qc1Ct: 1,
      qc2Ct: 0.007,
      probeAEndpt: 1.6,
      probeBEndpt: 2.33,
      probeCEndpt: 457,
      probeDEndpt: 12.43,
      probeEEndpt: 3.14,
      probeSpcEndpt: 8.9018,
      qc1Endpt: 0.1234,
      qc2Endpt: 1.22,
    },
  }

  // samples properties
  const samples = []
  await Promise.all(
    _.map(_.range(50), async i => {
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-NOERRORCODE-TB-${i}`,
          collectedOn: calculateDateForResult(i, 50, millisInMinute),
          sampleTypeId: sampleTypes.DBS.id,
          originSiteId: siteId,
        }
      )

      sample.id = await knex('Sample').insert(sample)
      samples.push(sample)
    })
  )

  const resultIds = []

  // random number of results
  const totalResults = 50 + Math.floor(Math.random() * 20 - 10)
  await Promise.all(
    _.map(_.range(totalResults), async i => {
      const sample = samples[i % samples.length]
      const randomDate = calculateDateForResult(i, totalResults, 6000)

      const result = {
        resultText: 'ERROR',
        category1: resultCategories.Error.id,
        category2: null,
        minLikelihood: 29,
        maxLikelihood: 34,
      }

      resultData.resultText = result.resultText
      const [resultId] = await knex('Result').insert(
        Object.assign({}, auditFields, {
          externalId: `UQTB-${i}`,
          assayId: assays.GxMtbRif.id,
          partnerId,
          geographyId,
          siteId,
          deviceId: device.id,
          resultWorkflowStatusId: resultWorkflowStatuses.Ordered.id,
          longitude,
          latitude,
          resultSourceId: resultSources.DiagnosticDevice.id,
          resultTypeId: resultTypes.Patient.id,
          sampleId: sample.id,
          sampleRunNumber: `${i % 2 + 1}`,
          sampleGroup: `GRP-NOERRORCODE-TB-${i % 5}`,
          resultCategory1: result.category1,
          resultCategory2: result.category2,
          resultData: JSON.stringify(resultData),
          assayVersion: '4',
          startedOn: randomDate,
          endedOn: addMinutes(randomDate, 100),
          consumableSerial: `${i}12`,
          consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
          consumableLot: `Lot ${i % 5}`,
          instrumentSerial: `S-1234-${i % 3}`,
          moduleName: `Module NOERRORCODE ${i % 4}`,
          moduleSerial: `M-NOERRORCODE-1234-${i % 4}`,
          researchId: `R-NOERRORCODE-ID-${i}`,
          patientData: JSON.stringify(patients[_.random(99)]),
          senderVersion: '4.6b',
          senderOperator: 'Marsha',
          notes: 'This is a test... result',
          errorCode: null,
          errorNotes: 'Some error without error code',
        })
      )

      resultIds.push(resultId)
    })
  )

  return resultIds
}
// -----------------
// calculateDateForResult
// -----------------
function calculateDateForResult(
  currentResult,
  totalResults,
  randomMillisToAdd
) {
  const daysToSubtract =
    resultTimeFrameInDays -
    Math.ceil(currentResult / totalResults * resultTimeFrameInDays)

  return addMilliseconds(
    subDays(now, daysToSubtract),
    _.random(randomMillisToAdd)
  )
}

async function triggerInitialIssue({
  knex,
  deviceId,
  options,
  issueType,
  dispatch,
  actionCreator,
}) {
  // dispatch action
  const action = actionCreator(deviceId, options)
  dispatch(deviceId, options)

  await waitForAction(action)
  await waitForIdle()
  const dateFrom = subMinutes(new Date(), 5)

  // get issues for last 5 mins for curent deviceId and issueType
  const issue = await knex('Issue as i')
    .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .innerJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .innerJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
    .where({
      'i.deviceId': deviceId,
      'it.externalId': issueType,
    })
    .where('ie.createdOn', '>', dateFrom)
    .orderBy('i.createdOn', 'desc')
    .first(
      'i.id',
      'i.level',
      'ie.id as issueEventId',
      'ie.data',
      'it.externalId as issueType',
      'is.externalId as issueStatus'
    )

  assert.equal(
    issue.issueStatus,
    'Active',
    `issueStatus (${issue.issueStatus}) is not Active`
  )

  const notifications = await knex('Notification as n')
    .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .join('JobFunction as jf', 'jf.id', 'nt.jobFunctionId')
    .join('Person as p', 'p.id', 'n.personId')
    .join('User as u', 'u.id', 'p.userId')
    .join('AlertMessage as am', 'am.id', 'n.alertMessageId')
    .where({ 'n.issueId': issue.id })
    .orderBy('jf.name')
    .select(
      'u.name as userName',
      'jf.name as jobFunction',
      'nt.level',
      'nt.canAcknowledge',
      'am.message as alertMessage'
    )

  assert.equal(notifications.length, 2)

  const [notificationLU, notificationRO] = notifications
  assert.equal(notificationLU.userName, USER_LU)
  assert.equal(notificationLU.jobFunction, 'Lab User')
  assert.equal(notificationLU.level, issue.level)
  assert.equal(notificationLU.canAcknowledge, 1)
  if (issueType === 'MachineUnknownError') {
    assert.equal(
      notificationLU.alertMessage,
      `Errors without code across machine, conduct troubleshooting`
    )
  } else {
    const { moduleName } = options
    assert.equal(
      processUsingHandlebarsSyntax(notificationLU.alertMessage, { moduleName }),
      `Errors without code on module ${moduleName}, conduct troubleshooting.`
    )
  }

  assert.equal(notificationRO.userName, USER_RO)
  assert.equal(notificationRO.jobFunction, 'Regional Officer')
  assert.equal(notificationRO.level, issue.level)
  assert.equal(notificationRO.canAcknowledge, 0)

  return { issueId: issue.id, issueEventId: issue.issueEventId }
}

// ********************************************
// test
// ********************************************
describe('Mynamar - issue type "UnknownError" (Error without error code)', () => {
  const partnerName = 'Myanmar'
  const adminUserName = 'myanmar_admin'
  let messageContext

  // for getting devices and modules with too many errors without error code
  // use same queries as in onResultLogged() in Mynamar plugin
  let deviceErrorQuery
  let sampleIds = []
  const issueEventIds = []
  const issueIds = []

  before(async () =>
    run(async knex => {
      // set messageContext
      messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        resultModuleUnknownError,
        resultMachineUnknownError,
      })

      // base query
      deviceErrorQuery = knex('Result as r')
        .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
        .where('rc.externalId', 'Error')
        .where('r.endedOn', '>=', last30day)
        .whereNull('r.errorCode')

      // generate sample entries in Result table and result all id's
      sampleIds = await insertSampleResults(knex, partnerName, adminUserName)
    })
  )
  after(async () =>
    run(async knex => {
      await waitForIdle()

      if (issueEventIds.length > 0) {
        await knex('IssueEvent')
          .whereIn('id', issueEventIds)
          .delete()
      }

      await cleanUpIssues(knex, issueIds)

      await queuePurge()

      // removed sample data
      await knex('Result')
        .whereIn('id', sampleIds)
        .delete()
    })
  )

  it('should find devices with too many errors without error code', () =>
    run(async () => {
      const devices = await deviceErrorQuery
        .clone()
        .select('r.deviceId')
        .count('r.id as errorCount')
        .groupBy('r.deviceId')
        .having('errorCount', '>=', machineMaxUnknownErrors)
      assert.equal(devices.length, 1)
    }))

  it('should find modules with too many errors without error code', () =>
    run(async knex => {
      const modules = await deviceErrorQuery
        .clone()
        .select(
          'r.deviceId',
          'r.moduleSerial as moduleSerial',
          knex.raw('coalesce(min(r.moduleName), r.moduleSerial) as moduleName')
        )
        .count('r.id as errorCount')
        .groupBy('r.moduleSerial')
        .having('errorCount', '>=', moduleMaxUnknownErrors)

      assert(modules.length > 1)
    }))

  it('should trigger MachineUnknownError issue', () =>
    run(async knex => {
      const resultId = sampleIds[0]

      const { deviceId } = await knex('Result')
        .where({ id: resultId })
        .first('deviceId')
      const options = undefined
      const { issueId, issueEventId } = await triggerInitialIssue({
        knex,
        deviceId,
        options,
        issueType: 'MachineUnknownError',
        dispatch: messageContext.resultMachineUnknownError,
        actionCreator: resultMachineUnknownError,
      })
      // keep id's for further deleting corresponding records in after() block
      issueEventIds.push(issueEventId)
      issueIds.push(issueId)
    }))

  it('should trigger ModuleUnknownError issue', () =>
    run(async knex => {
      const resultId = sampleIds[0]

      const { deviceId, moduleSerial, moduleName } = await knex('Result')
        .where({ id: resultId })
        .first(
          'deviceId',
          'moduleSerial',
          knex.raw('coalesce(min(moduleName), moduleSerial) as moduleName')
        )
      const options = { moduleSerial, moduleName }
      const { issueId, issueEventId } = await triggerInitialIssue({
        knex,
        deviceId,
        options,
        issueType: 'ModuleUnknownError',
        dispatch: messageContext.resultModuleUnknownError,
        actionCreator: resultModuleUnknownError,
      })
      // keep id's for further deleting corresponding records in after() block
      issueEventIds.push(issueEventId)
      issueIds.push(issueId)
    }))
})
