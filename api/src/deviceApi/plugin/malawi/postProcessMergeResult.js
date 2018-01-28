const _ = require('lodash')
const { addResultWorkflowLogIfChanged } = require('../common')
const { notifyResultUpdated } = require('../../../messages')

const VALIDATED_EXTERNALID = 'Validated'
const DELIVERABLE_EXTERNALID = 'Deliverable'
const EXTERNAL_ID_HIV_VL = 'HivVl'
const EXTERNAL_ID_EID = 'EID'
const DEVICE_TYPE_EXTERNAL_ID = 'CHAILIMS'
const RESULT_TEXT_LDL = '< LDL'

async function postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  const { deviceId } = result
  await addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    'Device API Update',
    now
  )

  const deviceTypeExternalId = (await knex('Device as d')
    .where('d.id', deviceId)
    .join('DeviceType as dt', 'd.deviceTypeid', 'dt.id')
    .first('dt.externalId')).externalId

  if (deviceTypeExternalId === DEVICE_TYPE_EXTERNAL_ID) {
    await checkResultDeliverable(context, result)
    await addResultCategory(context, result)
  }

  // TODO do we want to consume in inventory in malawi plugin? (we don't use it)
  // await consumeInventoryForResult(knex, payload, result)

  return {}
}

// Add category to result]
async function addResultCategory(context, result) {
  const { knex, dispatch } = context
  const { id: resultId, assayId, resultData } = result
  const { resultText, copies } = JSON.parse(resultData)
  const assayExternalId = (await knex('Assay as a')
    .where({ 'a.id': assayId })
    .first('a.externalId')).externalId

  // Add EID categories
  let externalId = ''
  if (assayExternalId === EXTERNAL_ID_EID) {
    if (resultText === 'Collect New Sample') {
      externalId = 'CollectNewSample'
    } else if (resultText === 'Discordant') {
      externalId = 'Discordant  '
    } else if (resultText === 'Indeterminate') {
      externalId = 'Indeterminate'
    } else if (resultText === 'Invalid') {
      externalId = 'Invalid'
    } else if (resultText === 'Negative') {
      externalId = 'NotDetected'
    } else if (resultText === 'Positive') {
      externalId = 'Detected'
    }
  } else if (assayExternalId === EXTERNAL_ID_HIV_VL) {
    // Add HIV VL Categories
    if ((copies && copies < 1000) || _.includes(resultText, RESULT_TEXT_LDL)) {
      externalId = 'LessThan1000'
    } else if (copies && copies >= 1000) {
      externalId = 'MoreThan1000'
    } else if (_.includes(resultText, 'Rejected')) {
      externalId = 'Rejected'
    } else if (_.includes(resultText, 'Missing')) {
      externalId = 'Missing'
    }
  }

  if (externalId) {
    const resultCategoryId = (await knex('ResultCategory')
      .where('externalId', externalId)
      .first('id')).id

    // Update Result Category
    await knex('Result')
      .where('id', resultId)
      .update('resultCategory1', resultCategoryId)
    dispatch(
      notifyResultUpdated(
        resultId,
        { resultCategory1: resultCategoryId },
        'MalawiPlugin'
      )
    )
  }
}

async function checkResultDeliverable(context, result) {
  const { knex, dispatch, now } = context
  const { id: resultId, patientData } = result

  // Now's a good time to see if the result is in the
  // status "Validated" and can be promoted to "Deliverable" base on patient data
  if (patientData && patientDataIsComplete(JSON.parse(patientData))) {
    const resultWorkflowExternalId = (await knex('Result as r')
      .where('r.id', resultId)
      .join('ResultWorkflowStatus as rw', 'r.resultWorkflowStatusId', 'rw.id')
      .first('rw.externalId')).externalId

    // only auto update if not already in deliverable
    // status, it hasn't been delivered yet,
    // and it is now in the status "Validated"
    if (resultWorkflowExternalId === VALIDATED_EXTERNALID) {
      const resultWorkflowDeliverableId = (await knex('ResultWorkflowStatus')
        .where('externalId', DELIVERABLE_EXTERNALID)
        .first('id')).id

      await knex('Result')
        .where('id', resultId)
        .update({
          resultWorkflowStatusId: resultWorkflowDeliverableId,
          // auto QC-check Deliverable results RRT-313
          qcCheck: 1,
        })

      // add a second so this entry shows up after the workflow status log entry
      // that was added as part of the original update
      const logEntryNow = new Date(now.getTime() + 1000)
      await knex('ResultWorkflowLog').insert({
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
