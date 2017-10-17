const { addResultWorkflowLogIfChanged } = require('../common')
const { notifyResultUpdated } = require('../../../messages')

const VALIDATED_EXTERNALID = 'Validated'
const DELIVERABLE_EXTERNALID = 'Deliverable'
const ASSAY_TYPE_HIV_VL = 'HivVL'
const ASSAY_TYPE_EID = 'EID'

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
  yield* addResultCategory(context, result)
  return {}
}

// Add category to result]
function* addResultCategory(context, result) {
  const { knex, dispatch } = context
  const { id: resultId, assayId, resulData: { resultText, copies } } = result

  const assayExternalId = yield knex('Assay').where('assayId', assayId)
    .externalId

  // Add EID categories
  let externalId = ''
  if (assayExternalId === ASSAY_TYPE_EID) {
    if (resultText === 'Collect New Sample') {
      externalId = 'Collect New Sample'
    } else if (resultText === 'Discordant ') {
      externalId = 'Discordant  '
    } else if (resultText === 'Intermediate') {
      externalId = 'Intermediate'
    } else if (resultText === 'Invalid') {
      externalId = 'Invalid'
    } else if (resultText === 'Negative') {
      externalId = 'Not Detected'
    } else if (resultText === 'Not Detected') {
      externalId = 'Detected'
    } else {
      externalId = 'Unknown'
    }
  } else if (assayExternalId === ASSAY_TYPE_HIV_VL) {
    // Add HIV VL Categories
    if (copies) {
      if (copies < 1000) {
        externalId = '<1000'
      } else {
        externalId = '1000+'
      }
    } else {
      if (resultText === 'Rejected') {
        externalId = 'Rejected'
      }
      if (resultText === 'Missing') {
        externalId = 'Missing'
      }
    }
  }

  const resultCategoryId = yield knex('ResultCategory')
    .where('externalId', externalId)
    .first('id')

  // Update Result Category
  yield knex('Result')
    .where('id', resultId)
    .update('resultCategoryId1', resultCategoryId)

  dispatch(
    notifyResultUpdated(
      resultId,
      { resultCategoryId1: resultCategoryId },
      'MalawiPlugin'
    )
  )
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

module.exports = postProcessMergeResult
