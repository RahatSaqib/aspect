const Boom = require('@hapi/boom')
const _ = require('lodash')
const { getUser } = require('../../auth/service')
const {
  getResultItemTransformedDataV2,
  fieldNameToFollowUpTypeIdMappings,
  getLatestFollowUpsFromFolloups,
} = require('./common/logic')
const { getConstraints } = require('../../auth/constraints')
const { resultTreatmentStatusToId, resultWorkflowStatusToId } = require('../../shared/dictionary')
const {
  getFollowUpsForResultFollowup,
  getResultFollowUps,
  getLastTreatmentStatusByResult,
  getTreatmentStatus,
  setTreatmentStatusLog,
  updateResult,
  getTreatmentStatusLogId,
  updateResultTreatmentStatusLog,
  addResultFollowUp,
  updateFollowUpDate,
  deleteResultFollowUp,
  insertResultWorkflowLog,
  updateResultWorkflowLog,
  getFollowUpsOfResultById,
  getCommentsOfResultById,
  getItemsV2,
  generateResultQueryV2,
  getLatestResultWorkflowLog,
} = require('./common/db')

const DELIVERED = 'Delivered'
const ACKNOWLEDGED = 'Acknowledged'

async function clinicalResponse(request) {
  const { payload, params } = request
  const { resultId } = params
  const clinicalResponseData = payload
  // get follow ups for a single result
  const followUps = await getFollowUpsOfResultById({ id: resultId })
  const latestFollowUps = getLatestFollowUpsFromFolloups(followUps)
  let response
  await Promise.all(
    clinicalResponseData.map(async data => {
      const latestFollowUp = _.find(
        latestFollowUps,
        f => f.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings[data.fieldName]
      )
      if (
        (latestFollowUp?.updatedOn < data.clientTime || !latestFollowUp) &&
        (fieldNameToFollowUpTypeIdMappings[data.fieldName] === 'treatment' ||
          fieldNameToFollowUpTypeIdMappings[data.fieldName] === 'outcome')
      ) {
        response = await addClinicalResponse(request, data)
      } else if (data.fieldName === 'confirmed') {
        response = await updateWorkflowStatus(request, data)
      }
    })
  ).then(async () => {
    // get follow ups for a single result
    const followUps = await getFollowUpsOfResultById({ id: resultId })
    const latestFollowUps = getLatestFollowUpsFromFolloups(followUps)
    clinicalResponseData.map(async data => {
      if (data.fieldName === 'treatmentStarted' || data.fieldName === 'outcomeOccurred') {
        response = await updateResultFollowUp(request, data, latestFollowUps)
      }
    })
  })
  return {
    ok: !!response,
    data: response,
  }
}

// Add result follow up based on follow up type and value. Delete follow up if any follow up type's value is null
async function addClinicalResponse(request, data) {
  const { auth, params } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)
  if (data.value && data.value.toLowerCase().replace(/\s'/g, '') !== 'null') {
    const followUp = await getFollowUpsForResultFollowup(data.value)
    if (!followUp) {
      return Boom.badRequest('Invalid follow up ID')
    }
    await addResultFollowUp(resultId, data.value, followUp.id, data.clientTime, currentUserId, currentUserId)
  } else {
    await deleteResultFollowUp(resultId, fieldNameToFollowUpTypeIdMappings[data.fieldName], data.clientTime)
  }
  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    resultId,
    data.clientTime,
    'FollowUp',
    'Client API'
  )
}

// Update treatmentStarted and outcomeOccurred based on followup type and value
async function updateResultFollowUp(request, data, followUps) {
  const { auth, params } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  const type = data.fieldName === 'outcomeOccurred' ? 'outcome' : 'treatment'
  const followUp = _.find(followUps, f => f.followUpTypeExternalId === type)
  if (!followUp) {
    return Boom.badRequest('Invalid follow up ID')
  }
  const affectedRows = await updateFollowUpDate(
    data.value,
    resultId,
    followUp.externalId,
    currentUserId,
    followUp,
    data.clientTime
  )
  if (affectedRows === 0) {
    return Boom.notFound('Could not find follow up')
  }

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    resultId,
    data.clientTime,
    'FollowUp',
    'Client API'
  )
}

// supporting method for updateResultFollowUp
async function updateTreatmentStatusBasedOnFollowUps(request, currentUserId, resultId, clientDate, data, method) {
  const followUps = await getResultFollowUps(resultId)
  let treatmentStatusExternalId = 'AwaitingTreatment'
  if (_.find(followUps, f => f.followUpTypeExternalId === 'treatment')) {
    treatmentStatusExternalId = 'OnTreatment'
  } else if (_.find(followUps, f => f.followUpTypeExternalId === 'outcome' && f.externalId !== 'cured')) {
    treatmentStatusExternalId = 'NotPossible'
  }

  return updateTreatmentStatus(
    request,
    currentUserId,
    resultId,
    null,
    treatmentStatusExternalId,
    data,
    method,
    clientDate
  )
}

// supporting method for updateTreatmentStatusBasedOnFollowUps
async function updateTreatmentStatus(
  request,
  currentUserId,
  resultId,
  resultTreatmentStatusId,
  resultTreatmentStatusExternalId,
  data,
  method,
  changedOn = new Date()
) {
  const now = new Date()

  const lastTreatment = await updateTreatmentStatusByResultId(
    currentUserId,
    resultId,
    resultTreatmentStatusExternalId,
    resultTreatmentStatusId,
    data,
    method,
    changedOn
  )

  const response = await showResult(request)
  response.treatmentStatus = lastTreatment

  if (!response.resultTreatmentStatusCreatedOn) {
    response.resultTreatmentStatusCreatedOn = response.endedOn || response.startedOn || now
  }

  return response
}

// supporting method for updateTreatmentStatus
async function updateTreatmentStatusByResultId(
  userId,
  resultId,
  resultTreatmentStatusExternalId,
  resultTreatmentStatusId,
  data,
  method,
  changedOn = new Date()
) {
  let treatmentStatusId = null
  // check if a externalId is provided
  if (resultTreatmentStatusExternalId) {
    treatmentStatusId = await resultTreatmentStatusToId(resultTreatmentStatusExternalId)
    if (!treatmentStatusId) {
      return Boom.badRequest('Invalid externalId')
    }
  } else if (resultTreatmentStatusId) {
    // check if value of resultTreatmentStatusId is valid
    const treatmentStatus = await getTreatmentStatus(resultTreatmentStatusId)
    if (!treatmentStatus) {
      return Boom.badRequest('Invalid resultTreatmentStatusId')
    }
    treatmentStatusId = resultTreatmentStatusId
  }
  let lastTreatment = await getLastTreatmentStatusByResult(resultId)
  if (treatmentStatusId && lastTreatment) {
    const [treatmentStatusLogId] = await setTreatmentStatusLog(
      resultId,
      treatmentStatusId,
      method,
      data,
      changedOn,
      userId
    )

    if (!lastTreatment) {
      await updateResult(resultId, treatmentStatusLogId, userId)
      lastTreatment = await getLastTreatmentStatusByResult(resultId)
    }
  }

  if (data) {
    const [{ treatmentStatusLogId }] = await getTreatmentStatusLogId(resultId)
    await updateResultTreatmentStatusLog(treatmentStatusLogId, data, changedOn)
  }

  return lastTreatment
}

// update result workflow
async function updateWorkflowStatus(request, data) {
  const { auth, params } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getLatestResultWorkflowLog(resultId)
  const acknowledgedId = await resultWorkflowStatusToId(ACKNOWLEDGED)
  const deliveredId = await resultWorkflowStatusToId(DELIVERED)
  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: data.value ? acknowledgedId : deliveredId,
    createdBy: currentUserId,
    reason: null,
    changedOn: data.clientTime,
  }
  const errorMessage = await updateResultWorkflowStatusByResultId(
    resultWorkflowLogEntry,
    data.clientTime,
    result?.resultWorkflowStatusId,
    result?.resultWorkflowChangedOn
  )

  if (errorMessage) {
    return Boom.badRequest(errorMessage)
  }

  const response = await showResult(request)
  return response
}

// supporting function for update workflow status
async function updateResultWorkflowStatusByResultId(
  resultWorkflowLogEntry,
  clientDate,
  currentResultWorkflowStatusId,
  resultWorkflowChangedOn
) {
  // update the resultWorkflowStatusId.
  if (resultWorkflowLogEntry.resultWorkflowStatusId !== currentResultWorkflowStatusId) {
    if (resultWorkflowChangedOn < clientDate || !resultWorkflowChangedOn) {
      const [lastLogId] = await insertResultWorkflowLog(resultWorkflowLogEntry)
      await updateResultWorkflowLog(resultWorkflowLogEntry, lastLogId, new Date())
    }
  }
}

// generate result
async function showResult(request) {
  const {
    params: { resultId },
    auth,
  } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const myResultQuery = generateResultQueryV2(false, dataConstraints, resultId)
  // return result when both queries are finished
  const [data] = await getItemsV2(myResultQuery, resultId)
  // get follow ups for all result in the response for performance (filter later)
  const followUps = await getFollowUpsOfResultById(data)
  // get comments for all result in the response for performance (filter later)
  const comments = await getCommentsOfResultById(data)

  const result = await getResultItemTransformedDataV2(data, true, followUps, comments)
  return result || Boom.notFound()
}

module.exports = {
  clinicalResponse,
}
