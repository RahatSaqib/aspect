const Boom = require('@hapi/boom')
const _ = require('lodash')
const Promise = require('bluebird')
const { getUser } = require('../../auth/service')
const {
  getResultItemTransformedDataV2,
  fieldNameToFollowUpTypeIdMappings,
  ACKNOWLEDGED,
  NOT_POSSIBLE_FOLLOW_UP_TYPE,
} = require('./common/logic')
const { updateResultWorkflowStatusByResultId } = require('./updateWorkflowStatus')
const { getConstraints } = require('../../auth/constraints')
const { resultTreatmentStatusToId, resultWorkflowStatusToId } = require('../../shared/dictionary')
const {
  getFollowUpsForResultFollowup,
  getLastTreatmentStatusByResult,
  setTreatmentStatusLog,
  updateResult,
  addResultFollowUp,
  deleteResultFollowUpNotPossible,
  insertResultWorkflowLog,
  deleteResultWorkflowLogs,
  getFollowUpsOfResultById,
  getCommentsOfResultById,
  getItemsV2,
  generateResultQueryV2,
  getLatestResultWorkflowLog,
  getLatestResultWorkflowLogBefore,
  getCurrentResultWorkflowStatus,
  updateResultWithResultWorkflowLog,
} = require('./common/db')
const { getAcknowledgementsByResultIds } = require('../entries/result/common/db')

const ACKNOWLEDGED_FIELD_NAME = 'confirmed'
const NOT_POSSIBLE_FIELD_NAME = 'followUpNotPossible'
const NOT_POSSIBLE_REASON_FIELD_NAME = 'followUpNotPossibleReason'

async function clinicalResponse(request) {
  const {
    auth: { credentials },
    payload,
    params,
  } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(credentials.name)
  const dataConstraints = await getConstraints(credentials)
  let response = await showResult(resultId, dataConstraints)
  if (response?.isBoom) {
    throw response
  }
  // If the result has been recorded in the register, acknowledge the result
  const confirmedValueCaptured = _.sortBy(
    payload.filter(fuv => fuv.fieldName === ACKNOWLEDGED_FIELD_NAME),
    fuv => fuv.clientTime
  ).reverse()[0]
  if (confirmedValueCaptured) {
    if (confirmedValueCaptured.value) {
      response = await acknowledgeResult(resultId, currentUserId, confirmedValueCaptured.clientTime, dataConstraints)
    } else {
      response = await unAcknowledgeResult(resultId, currentUserId, confirmedValueCaptured.clientTime, dataConstraints)
    }
  }

  // Find the standard treatment & outcome follow-up values & dates that have been sent in the payload
  const followUpTypeExternalIds = Object.values(fieldNameToFollowUpTypeIdMappings)
  const standardFollowUpValuesInPayload = payload.filter(
    fuv => followUpTypeExternalIds.includes(fuv.fieldName) && fuv.value !== NOT_POSSIBLE_FOLLOW_UP_TYPE
  )
  const followUpDatesOccurredInPayload = payload.filter(fuv =>
    followUpTypeExternalIds.map(fut => `${fut}Occurred`).includes(fuv.fieldName)
  )
  const standardFollowUpsInPayload = standardFollowUpValuesInPayload.map(value => {
    // Find the follow-up date occurred captured for the matching follow-up immediately after the follow-up was captured
    const followUpDate =
      _.sortBy(
        followUpDatesOccurredInPayload.filter(
          date => date.fieldName === `${value.fieldName}Occurred` && date.clientTime >= value.clientTime
        ),
        date => date.clientTime
      )[0]?.value || value.clientTime
    return {
      externalId: value.value,
      resultId,
      date: followUpDate,
      createdOn: value.clientTime,
      createdBy: currentUserId,
      updatedOn: value.clientTime,
      updatedBy: currentUserId,
    }
  })
  await Promise.each(
    _.sortBy(standardFollowUpsInPayload, fu => fu.updatedBy),
    async fu => {
      const followUpId = await getFollowUpsForResultFollowup(fu.externalId)
      await addResultFollowUp(fu.resultId, fu.externalId, followUpId, fu.date, fu.createdBy, fu.updatedBy)
    }
  )

  // If the result has been marked as follow-up not possible
  const mostRecentNotPossibleValueCaptured = _.sortBy(
    payload.filter(fuv => fuv.fieldName === NOT_POSSIBLE_FIELD_NAME),
    fuv => fuv.clientTime
  ).reverse()[0]
  if (mostRecentNotPossibleValueCaptured) {
    if (mostRecentNotPossibleValueCaptured.value) {
      // As long as there is no treatment captured afterwards that would invalidate notPossible?
      const mostRecentTreatmentValueCaptured = _.sortBy(
        payload.filter(
          fuv =>
            fuv.fieldName === fieldNameToFollowUpTypeIdMappings.treatment && fuv.value !== NOT_POSSIBLE_FOLLOW_UP_TYPE
        ),
        fuv => fuv.clientTime
      ).reverse()[0]
      if (
        !mostRecentTreatmentValueCaptured ||
        mostRecentTreatmentValueCaptured.clientTime <= mostRecentNotPossibleValueCaptured.clientTime
      ) {
        const notPossibleReasonValueCaptured = _.sortBy(
          payload.filter(fuv => fuv.fieldName === NOT_POSSIBLE_REASON_FIELD_NAME),
          fuv => fuv.clientTime
        ).reverse()[0] || {
          value: null,
          clientTime: mostRecentNotPossibleValueCaptured.clientTime,
        }
        const followUp = await getFollowUpsForResultFollowup(NOT_POSSIBLE_FOLLOW_UP_TYPE)
        await addResultFollowUp(
          resultId,
          NOT_POSSIBLE_FOLLOW_UP_TYPE,
          followUp.id,
          mostRecentNotPossibleValueCaptured.clientTime,
          currentUserId,
          currentUserId
        )
        response = await flagResult(
          resultId,
          currentUserId,
          notPossibleReasonValueCaptured.value,
          mostRecentNotPossibleValueCaptured.clientTime
        )
        await updateTreatmentStatusByResultId(
          currentUserId,
          mostRecentNotPossibleValueCaptured.clientTime,
          resultId,
          'NotPossible',
          mostRecentNotPossibleValueCaptured.clientTime
        )
      }
    } else {
      await deleteResultFollowUpNotPossible(resultId, mostRecentNotPossibleValueCaptured.clientTime)
      const resultFollowUps = await getFollowUpsOfResultById(resultId)
      const latestTreatment = resultFollowUps.find(
        rfu =>
          rfu.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.treatment &&
          rfu.followUpExternalId !== NOT_POSSIBLE_FOLLOW_UP_TYPE
      )
      await updateTreatmentStatusByResultId(
        currentUserId,
        mostRecentNotPossibleValueCaptured.clientTime,
        resultId,
        _.isNil(latestTreatment) ? 'AwaitingTreatment' : 'OnTreatment',
        mostRecentNotPossibleValueCaptured.clientTime
      )
      response = await unflagResult(resultId, currentUserId, mostRecentNotPossibleValueCaptured.clientTime)
    }
  }
  if (!response) {
    response = await showResult(resultId, dataConstraints)
  }
  return {
    ok: !!response,
    data: response,
  }
}

const FLAGGED_EXTERNALID = 'Flagged'
const PURGED_EXTERNALID = 'Purged'
const DELIVERED_EXTERNALID = 'Delivered'

async function flagResult(resultId, currentUserId, reason, date) {
  const resultWorkflowLog = await getLatestResultWorkflowLog(resultId)
  const flaggedId = await resultWorkflowStatusToId(FLAGGED_EXTERNALID)
  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: flaggedId,
    createdBy: currentUserId,
    reason,
    changedOn: date,
  }
  const errorMessage = await updateResultWorkflowStatusByResultId(
    resultWorkflowLogEntry,
    date,
    resultWorkflowLog?.resultWorkflowChangedOn
  )
  if (errorMessage) {
    return Boom.badRequest(errorMessage)
  }
  return {
    ok: true,
    data: `Clinical response has been flagged as not possible`,
  }
}

async function unflagResult(resultId, currentUserId, date) {
  const previousResultWorkflowStatus = (await getLatestResultWorkflowLogBefore(resultId, FLAGGED_EXTERNALID)) || {}
  if (!previousResultWorkflowStatus.resultWorkflowStatusId) {
    const deliveredId = await resultWorkflowStatusToId(DELIVERED_EXTERNALID)
    previousResultWorkflowStatus.resultWorkflowStatusId = deliveredId
    previousResultWorkflowStatus.resultWorkflowChangedOn = date
  }
  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: previousResultWorkflowStatus.resultWorkflowStatusId,
    createdBy: currentUserId,
    changedOn: date,
  }
  const errorMessage = await updateResultWorkflowStatusByResultId(
    resultWorkflowLogEntry,
    date,
    previousResultWorkflowStatus?.resultWorkflowChangedOn
  )
  if (errorMessage) {
    return Boom.badRequest(errorMessage)
  }
  return {
    ok: true,
    data: `Clinical response has been flagged as possible`,
  }
}

// supporting method for updateTreatmentStatus
async function updateTreatmentStatusByResultId(
  userId,
  now,
  resultId,
  resultTreatmentStatusExternalId,
  changedOn = new Date()
) {
  const treatmentStatusId = await resultTreatmentStatusToId(resultTreatmentStatusExternalId)
  if (!treatmentStatusId) {
    throw Boom.badRequest('Invalid externalId')
  }
  const [treatmentStatusLogId] = await setTreatmentStatusLog(
    resultId,
    treatmentStatusId,
    'Client API',
    null,
    changedOn,
    userId,
    now
  )
  await updateResult(resultId, treatmentStatusLogId, userId, now)
  return getLastTreatmentStatusByResult(resultId)
}

// update result workflow
async function acknowledgeResult(resultId, currentUserId, changedOn, dataConstraints) {
  const acknowledgedId = await resultWorkflowStatusToId(ACKNOWLEDGED)
  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: acknowledgedId,
    createdBy: currentUserId,
    reason: null,
    changedOn,
  }
  const [resultWorkflowLogId] = await insertResultWorkflowLog(resultWorkflowLogEntry)
  const currentResultWorkflowStatus = await getCurrentResultWorkflowStatus(resultId)
  if (
    currentResultWorkflowStatus &&
    ![PURGED_EXTERNALID, FLAGGED_EXTERNALID].includes(currentResultWorkflowStatus.externalId)
  ) {
    await updateResultWithResultWorkflowLog(resultWorkflowLogEntry, resultWorkflowLogId, changedOn)
  }
  return showResult(resultId, currentUserId, changedOn, dataConstraints)
}

async function unAcknowledgeResult(resultId, currentUserId, changedOn, dataConstraints) {
  const acknowledgedId = await resultWorkflowStatusToId(ACKNOWLEDGED)
  const currentResultWorkflowStatus = await getCurrentResultWorkflowStatus(resultId)
  if (currentResultWorkflowStatus.externalId === ACKNOWLEDGED) {
    await updateResultWithResultWorkflowLog({ resultId, createdBy: currentUserId }, null, changedOn)
  }
  await deleteResultWorkflowLogs(resultId, acknowledgedId)
  if (currentResultWorkflowStatus) {
    const latestResultWorkflowLog = await getLatestResultWorkflowLog(resultId)
    if (latestResultWorkflowLog) {
      await updateResultWithResultWorkflowLog(
        { resultId, createdBy: currentUserId },
        latestResultWorkflowLog.id,
        changedOn
      )
    }
  }
  return showResult(resultId, dataConstraints)
}

// generate result
async function showResult(resultId, dataConstraints) {
  const myResultQuery = generateResultQueryV2(false, dataConstraints, resultId)
  // return result when both queries are finished
  const [data] = await getItemsV2(myResultQuery, resultId)
  if (!data) return Boom.notFound()
  const [acknowledgement] = await getAcknowledgementsByResultIds([data].filter(_.identity))
  // get follow-ups for all result in the response for performance (filter later)
  const followUps = await getFollowUpsOfResultById(resultId)
  // get comments for all result in the response for performance (filter later)
  const comments = await getCommentsOfResultById(data)
  const result = await getResultItemTransformedDataV2(data, true, followUps, comments, acknowledgement)
  return result || Boom.notFound()
}

module.exports = {
  clinicalResponse,
}
