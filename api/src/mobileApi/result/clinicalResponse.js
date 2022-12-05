const Boom = require('@hapi/boom')
const _ = require('lodash')
const { getUser } = require('../../auth/service')
const { getResultItemTransformedDataV2 } = require('./common/logic')
const { getConstraints } = require('../../auth/constraints')
const { resultTreatmentStatusToId } = require('../../shared/dictionary')
const {
  getFollowUpsForResultFollowup,
  getResultFollowUps,
  getLastTreatmentStatusByResult,
  getTreatmentStatus,
  setTreatmentStatusLog,
  updateResult,
  getTreatmentStatusLogId,
  updateResultTreatmentStatusLog,
  getResultFollowUpsbyResultIdExternalId,
  addResultFollowUp,
  getAffectedRowsbyResultFollowUp,
  getLatestResultFollowUps,
  deleteResultFollowUp,
  insertResultWorkflowLog,
  updateResultWorkflowLog,
  getFollowUpsOfResultById,
  getCommentsOfResultById,
  getItemsV2,
  generateResultQueryV2,
} = require('./common/db')

async function clinicalResponse(request) {
  const { payload, params } = request
  const { resultId } = params
  const clinicalResponseData = payload
  const followUps = await getLatestResultFollowUps(resultId)
  let response
  await Promise.all(
    clinicalResponseData.map(async data => {
      const latestFollowUp = _.find(followUps, f => f.followUpTypeExternalId === data.fieldName)
      if (
        (latestFollowUp?.updatedOn < data.clientTime || !latestFollowUp) &&
        (data.fieldName === 'treatment' || data.fieldName === 'outcome')
      ) {
        response = await addClinicalResponse(request, data, latestFollowUp)
      } else if (
        (latestFollowUp?.updatedOn < data.clientTime || !latestFollowUp) &&
        (data.fieldName === 'treatmentStarted' || data.fieldName === 'outcomeOccurred')
      ) {
        response = await updateResultFollowUp(request, data, followUps)
      } else if (data.fieldName === 'confirmed') {
        response = await updateWorkflowStatus(request, data)
      }
    })
  )
  return {
    ok: !!response,
    data: response,
  }
}

// Add result folloup basaed on followup type and value. Delete followup if any followup type's value is null
async function addClinicalResponse(request, data, latestFollowUp) {
  const { auth, params } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)
  const result = await showResult(request)
  if (data.value && data.value.toLowerCase().replace(/\s'/g, '') !== 'null') {
    const followUp = await getFollowUpsForResultFollowup(data.value)
    if (!followUp) {
      return Boom.badRequest('Invalid follow up ID')
    }

    const resultFollowUp = await getResultFollowUpsbyResultIdExternalId(resultId, data.value)
    if (resultFollowUp) {
      return Boom.badRequest('This result already has a follow up with this external ID.')
    }

    if (!latestFollowUp)
      await addResultFollowUp(
        resultId,
        data.value,
        followUp.id,
        data.clientTime,
        currentUserId,
        now,
        currentUserId,
        now
      )
  } else {
    await deleteResultFollowUp(result, data.fieldName, data.clientTime)
  }
  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
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
  const result = await showResult(request)

  const type = data.fieldName === 'outcomeOccurred' ? 'outcome' : 'treatment'
  const followUp = _.find(followUps, f => f.followUpTypeExternalId === type)
  if (!followUp) {
    return Boom.badRequest('Invalid follow up ID')
  }
  const affectedRows = await getAffectedRowsbyResultFollowUp(
    data.value,
    resultId,
    followUp.externalId,
    currentUserId,
    followUp,
    followUp.id,
    data.clientTime
  )
  if (affectedRows === 0) {
    return Boom.notFound('Could not find follow up')
  }

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
    data.clientTime,
    'FollowUp',
    'Client API'
  )
}

// supporting method for updateResultFollowUp
async function updateTreatmentStatusBasedOnFollowUps(request, currentUserId, result, clientDate, data, method) {
  const followUps = await getResultFollowUps(result)
  let treatmentStatusExternalId = 'AwaitingTreatment'
  if (_.find(followUps, f => f.followUpTypeExternalId === 'treatment')) {
    treatmentStatusExternalId = 'OnTreatment'
  } else if (_.find(followUps, f => f.followUpTypeExternalId === 'outcome' && f.externalId !== 'cured')) {
    treatmentStatusExternalId = 'NotPossible'
  }

  return updateTreatmentStatus(
    request,
    currentUserId,
    result,
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
  result,
  resultTreatmentStatusId,
  resultTreatmentStatusExternalId,
  data,
  method,
  changedOn = new Date()
) {
  const now = new Date()

  const lastTreatment = await updateTreatmentStatusByResultId(
    currentUserId,
    result.id,
    result.resultTreatmentStatusId,
    resultTreatmentStatusExternalId,
    resultTreatmentStatusId,
    data,
    method,
    changedOn
  )

  const response = await showResult(request)
  response.treatmentStatus = lastTreatment

  if (!response.resultTreatmentStatusCreatedOn) {
    response.resultTreatmentStatusCreatedOn = result.endedOn || result.startedOn || now
  }

  return response
}

// supporting method for updateTreatmentStatus
async function updateTreatmentStatusByResultId(
  userId,
  resultId,
  currentTreatmentStatusId,
  resultTreatmentStatusExternalId,
  resultTreatmentStatusId,
  data,
  method,
  changedOn = new Date()
) {
  const now = new Date()

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
  if (treatmentStatusId !== currentTreatmentStatusId && treatmentStatusId && lastTreatment) {
    const [treatmentStatusLogId] = await setTreatmentStatusLog(
      resultId,
      treatmentStatusId,
      method,
      data,
      now,
      changedOn,
      userId
    )

    if (!lastTreatment) {
      await updateResult(resultId, treatmentStatusLogId, userId, now)
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
  const result = await showResult(request)

  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: data.value ? 9 : 8,
    createdBy: currentUserId,
    reason: null,
    changedOn: data.clientTime,
  }
  const errorMessage = await updateResultWorkflowStatusByResultId(
    resultWorkflowLogEntry,
    data.clientTime,
    result.resultWorkflowStatusId,
    result.resultWorkflowChangedOn
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
    const [lastLogId] = await insertResultWorkflowLog(resultWorkflowLogEntry)

    if (resultWorkflowChangedOn < clientDate || !resultWorkflowChangedOn) {
      await updateResultWorkflowLog(resultWorkflowLogEntry, lastLogId, clientDate)
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
  const followUps1 = await getFollowUpsOfResultById(data)
  // get comments for all result in the response for performance (filter later)
  const comments = await getCommentsOfResultById(data)
  const latestFollowup = await getLatestResultFollowUps(resultId)

  const result = await getResultItemTransformedDataV2(data, true, followUps1, comments, latestFollowup)
  return result || Boom.notFound()
}

module.exports = {
  clinicalResponse,
}
