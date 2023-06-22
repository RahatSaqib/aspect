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
  deleteResultWorkflowLogs,
  getFollowUpsOfResultById,
  getCommentsOfResultById,
  getItemsV2,
  generateResultQueryV2,
} = require('./common/db')
const { getAcknowledgementsByResultIds } = require('../entries/result/common/db')

const ACKNOWLEDGED = 'Acknowledged'

async function clinicalResponse(request) {
  const result = await showResult(request)
  if (result?.isBoom) {
    throw result
  }
  const { payload, params } = request
  const { resultId } = params
  const clinicalResponseData = payload
  // get follow-ups for a single result
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
        ['treatment', 'outcome'].includes(fieldNameToFollowUpTypeIdMappings[data.fieldName])
      ) {
        response = await addClinicalResponse(request, data)
      } else if (data.fieldName === 'confirmed') {
        if (data.value) {
          response = await acknowledgeResult(request, data)
        } else {
          response = await unAcknowledgeResult(request)
        }
      }
    })
  ).then(async () => {
    // get follow-ups for a single result
    const followUps = await getFollowUpsOfResultById({ id: resultId })
    const latestFollowUps = getLatestFollowUpsFromFolloups(followUps)
    clinicalResponseData.map(async data => {
      if (['treatmentStarted', 'outcomeOccurred'].includes(data.fieldName)) {
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
    now,
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
  now,
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
      userId,
      now
    )

    if (!lastTreatment) {
      await updateResult(resultId, treatmentStatusLogId, userId, now)
      lastTreatment = await getLastTreatmentStatusByResult(resultId)
    }
  }

  if (data) {
    const [{ treatmentStatusLogId }] = await getTreatmentStatusLogId(resultId)
    await updateResultTreatmentStatusLog(treatmentStatusLogId, data, changedOn)
    await updateResult(resultId, treatmentStatusLogId, userId, now)
  }

  return lastTreatment
}

// update result workflow
async function acknowledgeResult(request, data) {
  const { auth, params } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)
  const acknowledgedId = await resultWorkflowStatusToId(ACKNOWLEDGED)
  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: acknowledgedId,
    createdBy: currentUserId,
    reason: null,
    changedOn: data.clientTime,
  }
  await insertResultWorkflowLog(resultWorkflowLogEntry)
  return showResult(request)
}

async function unAcknowledgeResult(request) {
  const { params } = request
  const { resultId } = params
  const acknowledgedId = await resultWorkflowStatusToId(ACKNOWLEDGED)
  await deleteResultWorkflowLogs(resultId, acknowledgedId)
  return showResult(request)
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
  if (!data) return Boom.notFound()
  const [acknowledgement] = await getAcknowledgementsByResultIds([data].filter(_.identity))
  // get follow-ups for all result in the response for performance (filter later)
  const followUps = await getFollowUpsOfResultById(data)
  // get comments for all result in the response for performance (filter later)
  const comments = await getCommentsOfResultById(data)
  const result = await getResultItemTransformedDataV2(data, true, followUps, comments, acknowledgement)
  return result || Boom.notFound()
}

module.exports = {
  clinicalResponse,
}
