const Boom = require('@hapi/boom')
const _ = require('lodash')
const { getUser } = require('../../auth/service')
const { getResultByResultId } = require('./common/logic')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { resultTreatmentStatusToId } = require('../../shared/dictionary')
const {
  getFollowUpsForResultFollowup,
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
  getResultFollowUpsbyResultIdExternalId,
  addResultFollowUp,
  getAffectedRowsbyResultFollowUp,
  getLatestResultFollowUps,
  deleteResultFollowUp,
  insertResultWorkflowLog,
  updateResultWorkflowLog,
  getLatestResultWorkflowStatusId,
} = require('./common/db')

async function clinicalResponse(request) {
  const { payload } = request
  const syncData = payload
  await Promise.all(
    syncData.map(async data => {
      switch (data.fieldName) {
        case 'treatment':
          await addClinicalResponse(request, data)
          break
        case 'outcome':
          await addClinicalResponse(request, data)
          break
        case 'treatmentStarted':
          await updateResultFollowUp(request, data)
          break
        case 'outcomeOccurred':
          await updateResultFollowUp(request, data)
          break
        case 'confirmed':
          await updateWorkflowStatus(request, data)
          break
        default:
          break
      }
    })
  )
  const response = await showResult(request)
  return response
}

// Add result folloup basaed on followup type and value. Delete followup if any followup type's value is null
async function addClinicalResponse(request, data) {
  const { auth, params } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)
  const result = await showResult(request)
  const followUps = await getLatestResultFollowUps(resultId)
  const latestFollowUp = _.find(followUps, f => f.followUpTypeExternalId === data.fieldName)
  if (data.value) {
    const followUp = await getFollowUpsForResultFollowup(data.value, null)
    if (!followUp) {
      return Boom.badRequest('Invalid follow up ID')
    }

    if (data.value) {
      const resultFollowUp = await getResultFollowUpsbyResultIdExternalId(resultId, data.value)
      if (resultFollowUp) {
        return Boom.badRequest('This result already has a follow up with this external ID.')
      }
    }
    if (latestFollowUp?.updatedOn < data.clientTime || !latestFollowUp)
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
async function updateResultFollowUp(request, data) {
  const { auth, params } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)
  const result = await showResult(request)

  const followUps = await getLatestResultFollowUps(resultId)
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
    changedOn: new Date(),
  }
  const errorMessage = await updateResultWorkflowStatusByResultId(
    resultWorkflowLogEntry,
    data.clientTime,
    result.data.resultWorkflowStatusId,
    result.data.resultWorkflowChangedOn
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
  const now = new Date()

  // update the resultWorkflowStatusId.
  if (resultWorkflowLogEntry.resultWorkflowStatusId !== currentResultWorkflowStatusId) {
    const [lastLogId] = await insertResultWorkflowLog(resultWorkflowLogEntry)

    if (resultWorkflowChangedOn < clientDate) {
      await updateResultWorkflowLog(resultWorkflowLogEntry, lastLogId, now)
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
  const { userName } = await getUser(auth.credentials.name)
  const resultQuery = await generateResultQueryForResultFollowUp(resultId, dataConstraints, SELECT_FIELDS_UTC)
  const followUps = await getLatestResultFollowUps(resultId)
  const resultWorkflowlog = await getLatestResultWorkflowStatusId(resultId)
  const result = await getResultByResultId(
    auth,
    resultId,
    dataConstraints,
    userName,
    resultQuery,
    followUps,
    resultWorkflowlog,
    getAssayForResultFollowup,
    getFileReferencesForResultFolloup,
    addConstraints,
    showResultFolloup,
    getResultNotesByResultIdForResultFollowup
  )
  return result.ok ? result : Boom.notFound()
}

module.exports = {
  clinicalResponse,
}
