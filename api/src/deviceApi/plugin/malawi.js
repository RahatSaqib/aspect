const { addResultWorkflowLogIfChanged } = require('./common')
const { dispatch, notifyResultUpdated } = require('../../messages')
const { mergeResult, getResult } = require('../result')

const VALIDATED_EXTERNALID = 'Validated'
const DELIVERABLE_EXTERNALID = 'Deliverable'

function* transformMergeResultPayload({ deviceType, payload }) {
  if (deviceType === 'CHAI') {
    return yield* handleChaiResult(payload)
  }
  return payload
}

function* postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  yield* addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    now
  )
  // TODO do we want to consume in inventory in malawi plugin? (we don't use it)
  // yield* consumeInventoryForResult(knex, payload, result)
  yield* checkResultDeliverable(context, result)
  return {}
}

function* onResultLogged({ knex, resultId, now }) {
  // see if it is a qcChecked deliverable CHAI result
  const checkChaiResult = yield knex('Result as r')
    .join('ResultWorkflowStatus as rws', 'r.resultWorkflowStatusId', 'rws.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Sample as sm', 'r.sampleId', 'sm.id')
    .where({
      'r.id': resultId,
      'rws.externalId': 'Deliverable',
      'r.qcCheck': 1,
      'dt.externalId': 'CHAI',
    })
    .first('sm.originSiteId as sampleSiteId')
  if (checkChaiResult == null) {
    return
  }
  const { sampleSiteId } = checkChaiResult

  // Get CHAI result in Device API format
  const chaiResult = yield* getResult(knex, resultId)

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
    const payload = {
      id: chaiResult.id,
      workflow: { status: { id: 'Deliverable' } },
      assay: { id: chaiResult.assay.id },
      sample: chaiResult.sample,
      data: chaiResult.data,
      patient: chaiResult.patient,
      endedOn: chaiResult.endedOn,
    }

    // auto QC Check new result
    const { processedResult, existingResult } = yield* mergeResult(
      knex,
      deviceId,
      payload,
      now
    )
    if (!existingResult) {
      yield knex('Result')
        .where({ id: processedResult.id })
        .update({ qcCheck: 1 })

      yield* addResultWorkflowLogIfChanged(
        knex,
        payload,
        processedResult,
        existingResult,
        now
      )
    }
    dispatch(notifyResultUpdated(processedResult.id, payload, 'MalawiPlugin'))
  }
}

function* handleChaiResult(payload) {
  // TODO Translate rawData, set result category, etc.
  return payload
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
  transformMergeResultPayload,
  postProcessMergeResult,
  onResultLogged,
}
