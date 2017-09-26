const _ = require('lodash')
const { addResultWorkflowLogIfChanged } = require('../common')
const { notifyResultUpdated } = require('../../../messages')
const { mergeResult, getResult } = require('../../result')

const DEVICE_TYPE_CHAI = 'CHAI'
const DEVICE_TYPE_REPORTER = 'RRT'

const DELIVERABLE_EXTERNALID = 'Deliverable'
const DELIVERED_EXTERNALID = 'Delivered'
const ACKNOWLEDGED_EXTERNALID = 'Acknowledged'
const FLAGGED_EXTERNALID = 'Flagged'
const ERROR_EXTERNALID = 'Error'

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

module.exports = onResultLogged
