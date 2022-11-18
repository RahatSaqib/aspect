const Boom = require('@hapi/boom')
const _ = require('lodash')
const { getUser } = require('../../auth/service')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { resultTreatmentStatusToId } = require('../../shared/dictionary')
const { getResultByResultId } = require('./common/logic')
const {
  getFollowUpsForResultFollowup,
  getAffectedRowsbyResultFollowUp,
  generateResultQueryForResultFollowUp,
  SELECT_FIELDS_UTC,
  getAssayForResultFollowup,
  getFileReferencesForResultFolloup,
  showResultFolloup,
  getResultNotesByResultIdForResultFollowup,
  getResultFollowUps,
  getLastTreatmentStatusByResult,
  getTreatmentStatus,
  setTreatmentStatusLog,
  updateResult,
  getTreatmentStatusLogId,
  updateResultTreatmentStatusLog,
} = require('./common/db')

async function resultFollowUpByResultId(request) {
  const response = await showResult(request)

  if (!response.data.resultTreatmentStatusCreatedOn) {
    response.data.resultTreatmentStatusCreatedOn = response.data.endedOn || response.data.startedOn || new Date()
  }

  return response
}

async function updateResultFollowUp(request) {
  const { auth, params, payload } = request
  const { resultId } = params
  const { date, id, externalId, followUpId, followUpExternalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)
  const result = await showResult(request)

  const followUp = await getFollowUpsForResultFollowup(followUpExternalId, followUpId)
  const affectedRows = await getAffectedRowsbyResultFollowUp(date, resultId, externalId, currentUserId, followUp, id)
  if (affectedRows === 0) {
    return Boom.notFound('Could not find follow up')
  }

  return updateTreatmentStatusBasedOnFollowUps(request, currentUserId, result, date, 'FollowUp', 'Client API')
}

async function updateTreatmentStatusBasedOnFollowUps(request, currentUserId, result, date, data, method) {
  const followUps = await getResultFollowUps(result)
  let treatmentStatusExternalId = 'AwaitingTreatment'
  if (_.find(followUps, f => f.followUpTypeExternalId === 'treatment')) {
    treatmentStatusExternalId = 'OnTreatment'
  } else if (_.find(followUps, f => f.followUpTypeExternalId === 'outcome' && f.externalId !== 'cured')) {
    treatmentStatusExternalId = 'NotPossible'
  }

  return updateTreatmentStatus(request, currentUserId, result, null, treatmentStatusExternalId, data, method)
}

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
    result.data.id,
    result.data.resultTreatmentStatusId,
    resultTreatmentStatusExternalId,
    resultTreatmentStatusId,
    data,
    method,
    changedOn
  )

  const response = await showResult(request)
  response.data.treatmentStatus = lastTreatment

  if (!response.data.resultTreatmentStatusCreatedOn) {
    response.data.resultTreatmentStatusCreatedOn = result.data.endedOn || result.data.startedOn || now
  }

  return response
}

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
  if (treatmentStatusId !== currentTreatmentStatusId && treatmentStatusId) {
    const [treatmentStatusLogId] = await setTreatmentStatusLog(
      resultId,
      treatmentStatusId,
      method,
      data,
      now,
      changedOn,
      userId
    )

    if (!lastTreatment || (lastTreatment && lastTreatment.changedOn < changedOn)) {
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

async function showResult(request) {
  const {
    params: { resultId },
    auth,
  } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { userName } = await getUser(auth.credentials.name)
  const resultQuery = await generateResultQueryForResultFollowUp(resultId, dataConstraints, SELECT_FIELDS_UTC)
  const result = await getResultByResultId(
    auth,
    resultId,
    dataConstraints,
    userName,
    resultQuery,
    getAssayForResultFollowup,
    getFileReferencesForResultFolloup,
    addConstraints,
    showResultFolloup,
    getResultNotesByResultIdForResultFollowup
  )
  return result.ok ? result : Boom.notFound()
}

module.exports = {
  updateResultFollowUp,
  resultFollowUpByResultId,
}
