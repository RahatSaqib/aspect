const _ = require('lodash')
const {
  mergeResult,
  getResult,
  addResultWorkflowLogIfChanged,
} = require('../../../deviceApi/result')
const { resultUpdated } = require('../../../result/actions')
const { resultWorkflowStatusToId } = require('../../../shared/dictionary')

const DEVICE_TYPE_CHAI = 'CHAILIMS'
const DEVICE_TYPE_REPORTER = 'AspectReporter'

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

function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ resultUpdated })
  return context.transact(async knex => {
    const now = new Date()
    await mergeResults({
      knex,
      now,
      resultId,
      actions: { resultUpdated: context.resultUpdated },
    })
  })
}

async function mergeResults({ knex, actions, resultId, now }) {
  const qcResult = await knex('Result as r')
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
      await mergeChaiResultToReporters(
        knex,
        actions,
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
      await mergeReporterToChaiResult(
        knex,
        actions,
        resultId,
        sampleSiteId,
        deviceName,
        now
      )
    }
  }
}

async function mergeChaiResultToReporters(
  knex,
  actions,
  resultId,
  sampleSiteId,
  deviceName,
  now
) {
  // Find all Reporter devices assigned to sample origin site
  // And merge result for that device with same external id
  const reporterDevices = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where({
      'd.siteId': sampleSiteId,
      'dt.externalId': DEVICE_TYPE_REPORTER,
    })
    .select('d.id as deviceId')

  const { sampleId } = await knex('Sample as sm')
    .join('Result as r', 'r.sampleId', 'sm.id')
    .where('r.id', resultId)
    .first('r.sampleId')

  // Get CHAI result in Device API format
  const chaiResult = await getResult(knex, resultId)
  const payload = reporterResultFromChaiResult(chaiResult)

  await Promise.all(
    _.map(reporterDevices, async device => {
      const { deviceId } = device
      const { processedResult, existingResult } = await mergeResult(
        knex,
        deviceId,
        payload,
        { sampleId, now }
      )
      if (!existingResult) {
        // auto QC Check new result and mark as deliverable, but do
        // not change workflow status otherwise
        const deliverableId = await resultWorkflowStatusToId(
          DELIVERABLE_EXTERNALID
        )
        await knex('Result')
          .where({ id: processedResult.id })
          .update({
            qcCheck: 1,
            resultWorkflowStatusId: deliverableId,
          })
        processedResult.qcCheck = 1
        processedResult.resultWorkflowStatusId = deliverableId

        await addResultWorkflowLogIfChanged(
          knex,
          payload,
          processedResult,
          existingResult,
          `Update from ${deviceName}`,
          now
        )
        await knex('ResultGeneratedResult').insert({
          sourceResultId: resultId,
          generatedResultId: processedResult.id,
        })
      }
      actions.resultUpdated(processedResult.id)
    })
  )
}

async function mergeReporterToChaiResult(
  knex,
  actions,
  resultId,
  sampleSiteId,
  deviceName,
  now
) {
  // Get Reporter result in Device API format
  const reporterResult = await getResult(knex, resultId)

  // We only want to update workflow status of CHAI Result
  // and only if in whitelisted updates
  const payload = {
    id: reporterResult.id,
    workflow: { status: { id: reporterResult.workflow.status.id } },
  }

  // Find all CHAI devices assigned to sample origin site
  // And merge result for that device with same external id
  const chaiDevices = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('Result as r', 'r.deviceId', 'd.id')
    .innerJoin('Sample as sm', 'r.sampleId', 'sm.id')
    .where({
      'sm.originSiteId': sampleSiteId,
      'dt.externalId': DEVICE_TYPE_CHAI,
    })
    .distinct('d.id as deviceId')

  await Promise.all(
    _.map(chaiDevices, async device => {
      const { deviceId } = device

      const { processedResult, existingResult } = await mergeResult(
        knex,
        deviceId,
        payload,
        now
      )
      const workflowChanged = await addResultWorkflowLogIfChanged(
        knex,
        payload,
        processedResult,
        existingResult,
        `Update from ${deviceName}`,
        now
      )
      // since we only updated workflow, only publish if changed
      // this also breaks a potential cycle on publish between CHAI and Reporter
      if (workflowChanged) {
        actions.resultUpdated(processedResult.id)
      }
    })
  )
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
