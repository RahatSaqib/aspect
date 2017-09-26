const _ = require('lodash')
const {
  addResultWorkflowLogIfChanged,
  updateResultWorkflowStatus,
} = require('../common')
const { notifyResultUpdated } = require('../../../messages')
const { mergeResult, getResult } = require('../../result')

const DEVICE_TYPE_CHAI = 'CHAI'
const DEVICE_TYPE_REPORTER = 'RRT'

const VALIDATED_EXTERNALID = 'Validated'
const DELIVERABLE_EXTERNALID = 'Deliverable'
const DELIVERED_EXTERNALID = 'Delivered'
const ACKNOWLEDGED_EXTERNALID = 'Acknowledged'
const FLAGGED_EXTERNALID = 'Flagged'
const ERROR_EXTERNALID = 'Error'
const PURGED_EXTERNALID = 'Purged'

const DONOT_LOG_DELIVERED = [
  DELIVERED_EXTERNALID,
  ACKNOWLEDGED_EXTERNALID,
  FLAGGED_EXTERNALID,
  ERROR_EXTERNALID,
]

const MERGEABLE_CHAI_IDS = [
  DELIVERABLE_EXTERNALID,
  DELIVERED_EXTERNALID,
  ACKNOWLEDGED_EXTERNALID,
  FLAGGED_EXTERNALID,
  ERROR_EXTERNALID,
]
const MERGEABLE_REPORTABLE_IDS = [
  DELIVERED_EXTERNALID,
  ACKNOWLEDGED_EXTERNALID,
  FLAGGED_EXTERNALID,
  ERROR_EXTERNALID,
]

const millisInDay = 1000 * 60 * 60 * 24

function* preProcessGetResult({ knex, dispatch, resultId, query, now }) {
  const offset = Number(query.offset)
  yield* updateResultWorkflowStatusOnGetResult(
    knex,
    dispatch,
    resultId,
    offset,
    now
  )
}

function* postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  yield* addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    'Device API Update',
    now
  )
  // TODO do we want to consume in inventory in malawi plugin? (we don't use it)
  // yield* consumeInventoryForResult(knex, payload, result)
  yield* checkResultDeliverable(context, result)
  return {}
}

function* postProcessUpdateSite(context, site, previousSite) {
  const { knex, dispatch, deviceId, deviceType, now } = context
  if (deviceType === DEVICE_TYPE_REPORTER && site.id !== previousSite.id) {
    yield* purgePreviousResults(knex, dispatch, deviceId, now)
    yield* generateHistoricalResults(knex, dispatch, deviceId, site.id, now)
  }
}

function* onResultLogged({ knex, dispatch, resultId, now }) {
  const qcResult = yield knex('Result as r')
    .join('ResultWorkflowStatus as rws', 'r.resultWorkflowStatusId', 'rws.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Sample as sm', 'r.sampleId', 'sm.id')
    .where({
      'r.id': resultId,
      'r.qcCheck': 1,
    })
    .first(
      'sm.originSiteId as sampleSiteId',
      'rws.externalId as workflowStatus',
      'dt.externalId as deviceType',
      'd.name as deviceName'
    )

  if (qcResult != null) {
    const { sampleSiteId, workflowStatus, deviceType, deviceName } = qcResult

    if (
      deviceType === DEVICE_TYPE_CHAI &&
      _.indexOf(MERGEABLE_CHAI_IDS, workflowStatus) !== -1
    ) {
      // it is a qcChecked CHAI result, merge into Reporter results
      yield* mergeChaiResultToReporters(
        knex,
        dispatch,
        resultId,
        sampleSiteId,
        deviceName,
        now
      )
    } else if (
      deviceType === DEVICE_TYPE_REPORTER &&
      _.indexOf(MERGEABLE_REPORTABLE_IDS, workflowStatus) !== -1
    ) {
      // it is a qcChecked Reportable result, merge into CHAI results
      yield* mergeReporterToChaiResult(
        knex,
        dispatch,
        resultId,
        sampleSiteId,
        deviceName,
        now
      )
    }
  }
}

function* purgePreviousResults(knex, dispatch, deviceId, now) {
  const { id: purgedStatusId } = yield knex('ResultWorkflowStatus')
    .where({ externalId: PURGED_EXTERNALID })
    .first('id')
  yield knex('Result')
    .where({ deviceId })
    .update({ resultWorkflowStatusId: purgedStatusId })
  const resultIds = yield knex('Result as r')
    .join('Device as d', 'r.deviceId', 'd.id')
    .where({
      'd.id': deviceId,
      'r.resultWorkflowStatusId': purgedStatusId,
    })
    .select('r.id as resultId', 'd.name as deviceName')
  const payload = { resultWorkflowStatus: PURGED_EXTERNALID }
  for (const { resultId, deviceName } of resultIds) {
    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: purgedStatusId,
      operator: '',
      reason: `Purge Result from ${deviceName} on change of site`,
      createdOn: now,
      changedOn: now,
    })
    dispatch(notifyResultUpdated(resultId, payload, 'MalawiPlugin'))
  }
}

function* generateHistoricalResults(
  knex,
  dispatch,
  deviceId,
  siteId,
  now = new Date()
) {
  const partner = yield knex('Site as s')
    .join('Partner as p', 's.partnerId', 'p.id')
    .where({ 's.id': siteId })
    .first(
      'p.deviceLogHistoryDays',
      'p.autoAcknowledgeOlderThanDays',
      'p.numberToLeaveUnacknowledged'
    )
  const {
    deviceLogHistoryDays,
    autoAcknowledgeOlderThanDays,
    numberToLeaveUnacknowledged,
  } = partner

  if (deviceLogHistoryDays == null) {
    return
  }

  const historyCutoff = new Date(
    +new Date() - deviceLogHistoryDays * millisInDay
  )

  const sourceResults = yield knex('DeviceLog as dl')
    .join('Result as r', 'dl.resultId', 'r.id')
    .join('ResultWorkflowStatus as rws', 'r.resultWorkflowStatusId', 'rws.id')
    .join('Device as d', 'dl.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Sample as sm', 'r.sampleId', 'sm.id')
    .where({
      'r.qcCheck': 1,
      'dt.externalId': DEVICE_TYPE_CHAI,
      'sm.originSiteId': siteId,
    })
    .where('dl.createdOn', '>=', historyCutoff)
    .whereIn('rws.externalId', MERGEABLE_CHAI_IDS)
    .orderBy('r.endedOn', 'asc')
    .distinct(
      'r.id as resultId',
      'sm.id as sampleId',
      'r.endedOn as resultEndedOn',
      'd.name as deviceName'
    )

  const autoAcknowledgeOlderThan = autoAcknowledgeOlderThanDays
    ? new Date(+new Date() - autoAcknowledgeOlderThanDays * millisInDay)
    : null
  const autoAcknowledgeMaxIndex =
    sourceResults.length - numberToLeaveUnacknowledged

  const { id: acknowledgedStatusId } = yield knex('ResultWorkflowStatus')
    .where({ externalId: ACKNOWLEDGED_EXTERNALID })
    .first('id')

  let index = -1
  for (const {
    resultId,
    resultEndedOn,
    deviceName,
    sampleId,
  } of sourceResults) {
    index += 1

    const sourceResult = yield* getResult(knex, resultId)
    const payload = reporterResultFromChaiResult(sourceResult)
    payload.workflow = { status: { id: DELIVERABLE_EXTERNALID } }

    const {
      processedResult,
      existingResult,
    } = yield* mergeResult(knex, deviceId, payload, { sampleId, now })
    yield* addResultWorkflowLogIfChanged(
      knex,
      payload,
      processedResult,
      existingResult,
      `Historical Result from ${deviceName}`,
      now
    )

    const autoAcknowledge =
      index < autoAcknowledgeMaxIndex &&
      (resultEndedOn != null &&
        autoAcknowledgeOlderThan != null &&
        +resultEndedOn < +autoAcknowledgeOlderThan)

    const resultUpdates = { qcCheck: 1 }
    if (autoAcknowledge) {
      processedResult.resultWorkflowStatusId = acknowledgedStatusId
      yield* addResultWorkflowLogIfChanged(
        knex,
        payload,
        processedResult,
        existingResult,
        `Auto acknowledged from ${deviceName}`,
        new Date(+now + 1000) // in future to maintain order in UI
      )
      resultUpdates.resultWorkflowStatusId = acknowledgedStatusId
    }

    Object.assign(processedResult, resultUpdates)
    yield knex('Result').where({ id: processedResult.id }).update(resultUpdates)
    yield knex('ResultGeneratedResult').insert({
      sourceResultId: resultId,
      generatedResultId: processedResult.id,
    })

    dispatch(notifyResultUpdated(processedResult.id, payload, 'MalawiPlugin'))
  }
}

function* mergeChaiResultToReporters(
  knex,
  dispatch,
  resultId,
  sampleSiteId,
  deviceName,
  now
) {
  // Find all Reporter devices assigned to sample origin site
  // And merge result for that device with same external id
  const reporterDevices = yield knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where({
      'd.siteId': sampleSiteId,
      'dt.externalId': DEVICE_TYPE_REPORTER,
    })
    .select('d.id as deviceId')

  const { sampleId } = yield knex('Sample as sm')
    .join('Result as r', 'r.sampleId', 'sm.id')
    .where('r.id', resultId)
    .first('r.sampleId')

  // Get CHAI result in Device API format
  const chaiResult = yield* getResult(knex, resultId)
  const payload = reporterResultFromChaiResult(chaiResult)

  for (const { deviceId } of reporterDevices) {
    const {
      processedResult,
      existingResult,
    } = yield* mergeResult(knex, deviceId, payload, { sampleId, now })
    if (!existingResult) {
      // auto QC Check new result and mark as deliverable, but do
      // not change workflow status otherwise
      const { id: deliverableId } = yield knex('ResultWorkflowStatus')
        .where({ externalId: DELIVERABLE_EXTERNALID })
        .first('id')
      yield knex('Result').where({ id: processedResult.id }).update({
        qcCheck: 1,
        resultWorkflowStatusId: deliverableId,
      })
      processedResult.qcCheck = 1
      processedResult.resultWorkflowStatusId = deliverableId

      yield* addResultWorkflowLogIfChanged(
        knex,
        payload,
        processedResult,
        existingResult,
        `Update from ${deviceName}`,
        now
      )
      yield knex('ResultGeneratedResult').insert({
        sourceResultId: resultId,
        generatedResultId: processedResult.id,
      })
    }
    dispatch(notifyResultUpdated(processedResult.id, payload, 'MalawiPlugin'))
  }
}

function* mergeReporterToChaiResult(
  knex,
  dispatch,
  resultId,
  sampleSiteId,
  deviceName,
  now
) {
  // Get Reporter result in Device API format
  const reporterResult = yield* getResult(knex, resultId)

  // We only want to update workflow status of CHAI Result
  // and only if in whitelisted updates
  const payload = {
    id: reporterResult.id,
    workflow: { status: { id: reporterResult.workflow.status.id } },
  }

  // Find all CHAI devices assigned to sample origin site
  // And merge result for that device with same external id
  const chaiDevices = yield knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('Result as r', 'r.deviceId', 'd.id')
    .innerJoin('Sample as sm', 'r.sampleId', 'sm.id')
    .where({
      'sm.originSiteId': sampleSiteId,
      'dt.externalId': DEVICE_TYPE_CHAI,
    })
    .distinct('d.id as deviceId')

  for (const { deviceId } of chaiDevices) {
    const { processedResult, existingResult } = yield* mergeResult(
      knex,
      deviceId,
      payload,
      now
    )
    const workflowChanged = yield* addResultWorkflowLogIfChanged(
      knex,
      payload,
      processedResult,
      existingResult,
      `Update from ${deviceName}`,
      now
    )
    // since we only updated workflow, only dispatch if changed
    // this also breaks a potential cycle on dispatching between CHAI and Reporter
    if (workflowChanged) {
      dispatch(notifyResultUpdated(processedResult.id, payload, 'MalawiPlugin'))
    }
  }
}

function reporterResultFromChaiResult(chaiResult) {
  return {
    id: chaiResult.id,
    assay: { id: chaiResult.assay.id },
    sample: chaiResult.sample,
    data: chaiResult.data,
    patient: chaiResult.patient,
    endedOn: chaiResult.endedOn,
  }
}

function* checkResultDeliverable(context, result) {
  const { knex, dispatch, now } = context
  const { id: resultId, patientData } = result

  // Now's a good time to see if the result is in the
  // status "Validated" and can be promoted to "Deliverable" base on patient data
  if (patientData && patientDataIsComplete(JSON.parse(patientData))) {
    const resultWorkflowExternalId = (yield knex('Result as r')
      .where('r.id', resultId)
      .join('ResultWorkflowStatus as rw', 'r.resultWorkflowStatusId', 'rw.id')
      .first('rw.externalId')).externalId

    // only auto update if not already in deliverable
    // status, it hasn't been delivered yet,
    // and it is now in the status "Validated"
    if (resultWorkflowExternalId === VALIDATED_EXTERNALID) {
      const resultWorkflowDeliverableId = (yield knex('ResultWorkflowStatus')
        .where('externalId', DELIVERABLE_EXTERNALID)
        .first('id')).id

      yield knex('Result')
        .where('id', resultId)
        .update('resultWorkflowStatusId', resultWorkflowDeliverableId)

      // add a second so this entry shows up after the workflow status log entry
      // that was added as part of the original update
      const logEntryNow = new Date(now.getTime() + 1000)
      yield knex('ResultWorkflowLog').insert({
        resultId,
        resultWorkflowStatusId: resultWorkflowDeliverableId,
        operator: null,
        changedOn: logEntryNow,
        createdOn: logEntryNow,
        reason: 'Validated & Complete Patient Data',
      })

      dispatch(
        notifyResultUpdated(
          resultId,
          { resultWorkflowStatus: DELIVERABLE_EXTERNALID },
          'MalawiPlugin'
        )
      )
    }
  }
}

function patientDataIsComplete(patientData) {
  return (
    patientData.name &&
    patientData.surname &&
    patientData.age &&
    patientData.gender &&
    (patientData.artNumber || patientData.hccNumber)
  )
}

function* updateResultWorkflowStatusOnGetResult(
  knex,
  dispatch,
  resultId,
  offset,
  now = new Date()
) {
  const row = yield knex('Result as r')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .leftJoin('Partner as p', 'r.partnerId', 'p.id')
    .where('r.id', resultId)
    .first(
      'r.startedOn',
      'r.endedOn',
      'r.deviceId',
      'r.id as resultId',
      'rs.externalId as resultWorkflowStatusId',
      'p.autoAcknowledgeOlderThanDays',
      'p.numberToLeaveUnacknowledged'
    )
  // only set to delivered the first time and
  // only if NOT acknowledged or flagged already
  if (
    row != null &&
    _.indexOf(DONOT_LOG_DELIVERED, row.resultWorkflowStatusId) === -1
  ) {
    yield* updateResultWorkflowStatus(
      knex,
      row.resultId,
      DELIVERED_EXTERNALID,
      now
    )
    dispatch(
      notifyResultUpdated(
        row.resultId,
        { resultWorkflowStatus: DELIVERED_EXTERNALID },
        'GetResult'
      )
    )
  }
}

module.exports = {
  preProcessGetResult,
  postProcessMergeResult,
  postProcessUpdateSite,
  onResultLogged,
}
