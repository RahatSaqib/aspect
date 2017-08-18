const _ = require('lodash')
const { addResultWorkflowLogIfChanged } = require('./common')
const { dispatch, notifyResultUpdated } = require('../../messages')
const { mergeResult, getResult } = require('../result')

const VALIDATED_EXTERNALID = 'Validated'
const DELIVERABLE_EXTERNALID = 'Deliverable'
const MERGEABLE_CHAI_IDS = ['Deliverable', 'Delivered', 'Acknowledged', 'Flagged', 'Error']
const MERGEABLE_REPORTABLE_IDS = ['Delivered', 'Acknowledged', 'Flagged', 'Error']

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

function* onResultLogged({ knex, resultId, now }) {
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

    if (deviceType === 'CHAI' &&
      _.indexOf(MERGEABLE_CHAI_IDS, workflowStatus) !== -1
    ){
      // it is a qcChecked CHAI result, merge into Reporter results
      yield* mergeChaiResultToReporters(knex, resultId, sampleSiteId, deviceName, now)
    } else if (deviceType === 'RRT' &&
      _.indexOf(MERGEABLE_REPORTABLE_IDS, workflowStatus) !== -1
    ){
      // it is a qcChecked Reportable result, merge into CHAI results
      yield* mergeReporterToChaiResult(knex, resultId, sampleSiteId, deviceName, now)
    }
  }
}

function* mergeChaiResultToReporters(knex, resultId, sampleSiteId, deviceName, now) {
  // Get CHAI result in Device API format
  const chaiResult = yield* getResult(knex, resultId)
  const payload = {
    id: chaiResult.id,
    assay: { id: chaiResult.assay.id },
    sample: chaiResult.sample,
    data: chaiResult.data,
    patient: chaiResult.patient,
    endedOn: chaiResult.endedOn,
  }

  // Find all Reporter devices assigned to sample origin site
  // And merge result for that device with same external id
  const reporterDevices = yield knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where({
      'd.siteId': sampleSiteId,
      'dt.externalId': 'RRT',
    })
    .select('d.id as deviceId')

  for (const { deviceId } of reporterDevices) {
    const { processedResult, existingResult } = yield* mergeResult(
      knex,
      deviceId,
      payload,
      now
    )
    if (!existingResult) {
      // auto QC Check new result and mark as deliverable, but do
      // not change workflow status otherwise
      const { id: deliverableId }  = yield knex('ResultWorkflowStatus')
        .where({ externalId: 'Deliverable'})
        .first('id')
      yield knex('Result')
        .where({ id: processedResult.id })
        .update({
          qcCheck: 1,
          resultWorkflowStatusId: deliverableId
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
    }
    dispatch(notifyResultUpdated(processedResult.id, payload, 'MalawiPlugin'))
  }
}

function* mergeReporterToChaiResult(knex, resultId, sampleSiteId, deviceName, now) {
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
      'dt.externalId': 'CHAI',
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

function* checkResultDeliverable(context, result) {
  const { knex, now } = context
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

      dispatch(notifyResultUpdated(resultId, payload, 'MalawiPlugin'))
    }
  }
}

function patientDataIsComplete(patientData) {
  if (
    patientData.name &&
    patientData.surname &&
    patientData.age &&
    patientData.gender &&
    (patientData.artNumber || patientData.hccNumber)
  ) {
    return true
  }
  return false
}

module.exports = {
  postProcessMergeResult,
  onResultLogged,
}
