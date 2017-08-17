const { addResultWorkflowLogIfChanged } = require('./common')

const VALIDATED_EXTERNALID = 'Validated'
const DELIVERABLE_EXTERNALID = 'Deliverable'

function* transformMergeResultPayload(context) {
  const { device: { deviceType } } = context
  if (deviceType === 'CHAI') {
    return yield* handleChaiResult(context)
  }
  return context.payload
}

function* postProcessMergeResult(context, result, previousResult) {
  yield* addResultWorkflowLogIfChanged(context, result, previousResult)
  // TODO do we want to consume in inventory in malawi plugin? (we don't use it)
  // yield* consumeInventoryForResult(context, result)
  yield* checkResultDeliverable(context, result)
  return {}
}

function* onResultLogged(context, result) {
  const { knex, now } = context
  const { id: resultId } = result
}

function* handleChaiResult(context) {
  return context.payload
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
