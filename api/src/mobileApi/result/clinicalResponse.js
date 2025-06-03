const Boom = require('@hapi/boom')
const _ = require('lodash')
const { getUser } = require('../../auth/service')
const {
  getResultItemTransformedDataV2,
  fieldNameToFollowUpTypeIdMappings,
  ACKNOWLEDGED,
  NOT_POSSIBLE_FOLLOW_UP_TYPE,
} = require('./common/logic')
const {
  updateResultWorkflowStatusByResultId,
  updateNotPossibleWorkflowStatusByResultId,
} = require('./updateWorkflowStatus')
const { getConstraints } = require('../../auth/constraints')
const { resultTreatmentStatusToId, resultWorkflowStatusToId } = require('../../shared/dictionary')
const {
  getFollowUpByExternalId,
  getLastTreatmentStatusByResult,
  setTreatmentStatusLog,
  updateResult,
  addResultFollowUp,
  deleteResultFollowUpNotPossible,
  insertResultWorkflowLog,
  deleteResultWorkflowLogs,
  deleteResultFollowUps,
  getFollowUpsOfResultById,
  getCommentsOfResultById,
  getItemsV2,
  generateResultQueryV2,
  getLatestResultWorkflowLog,
  getLatestResultWorkflowLogBefore,
  getCurrentResultWorkflowStatus,
  updateResultWithResultWorkflowLog,
  updateMostRecentResultFollowUp,
  getFollowUpsNotPossibleByResultById,
  updateResultFollowUp,
  deleteResultFollowUpTreatment,
} = require('./common/db')
const { getAcknowledgementsByResultIds } = require('../entries/result/common/db')
const { getBaseQueryForResults } = require('../../result/common/db')

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
  let resultEntry = await showResult(resultId, dataConstraints)
  if (resultEntry?.isBoom) {
    throw resultEntry
  }
  const mostRecentValueCaptured = _.sortBy(payload, value => value.clientTime).reverse()[0]
  if (mostRecentValueCaptured) {
    // If the result has been recorded in the register, acknowledge the result
    const confirmedValueCaptured = _.sortBy(
      payload.filter(fuv => fuv.fieldName === ACKNOWLEDGED_FIELD_NAME),
      fuv => fuv.clientTime
    ).reverse()[0]
    if (confirmedValueCaptured && resultEntry.clinicalResponse.recorded !== confirmedValueCaptured.value) {
      if (confirmedValueCaptured.value) {
        resultEntry = await acknowledgeResult(
          resultId,
          currentUserId,
          confirmedValueCaptured.clientTime,
          dataConstraints
        )
      } else {
        resultEntry = await unAcknowledgeResult(
          resultId,
          currentUserId,
          confirmedValueCaptured.clientTime,
          dataConstraints
        )
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

    followUpDatesOccurredInPayload.forEach(occurrence => {
      occurrence.value = new Date(occurrence.value)
    })

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
        followUpTypeExternalId: fieldNameToFollowUpTypeIdMappings[value.fieldName],
        resultId,
        date: followUpDate,
        createdOn: value.clientTime,
        createdBy: currentUserId,
        updatedOn: value.clientTime,
        updatedBy: currentUserId,
      }
    })
    const mostRecentTreatmentInPayload = _.sortBy(
      standardFollowUpsInPayload.filter(
        fu => fu.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.treatment
      ),
      fu => fu.updatedBy
    ).reverse()[0]
    if (mostRecentTreatmentInPayload) {
      const existingTreatmentAfter = _.sortBy(
        resultEntry.followUps.filter(
          fu =>
            fu.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.treatment &&
            fu.updatedOn.toISOString() >= mostRecentTreatmentInPayload.updatedOn.toISOString()
        ),
        fu => fu.updatedOn
      )[0]
      if (
        !existingTreatmentAfter &&
        (resultEntry.clinicalResponse.treatment !== mostRecentTreatmentInPayload.externalId ||
          (resultEntry.clinicalResponse.treatmentStarted?.toISOString() || '') !==
            (mostRecentTreatmentInPayload.date?.toISOString() || ''))
      ) {
        if (mostRecentTreatmentInPayload.externalId === null) {
          await deleteResultFollowUps(
            mostRecentTreatmentInPayload.resultId,
            mostRecentTreatmentInPayload.followUpTypeExternalId,
            mostRecentTreatmentInPayload.updatedBy,
            mostRecentTreatmentInPayload.updatedOn
          )
        } else if (resultEntry.clinicalResponse.treatment !== mostRecentTreatmentInPayload.externalId) {
          const followUp = await getFollowUpByExternalId(mostRecentTreatmentInPayload.externalId)
          await addResultFollowUp(
            mostRecentTreatmentInPayload.resultId,
            mostRecentTreatmentInPayload.externalId,
            followUp.id,
            mostRecentTreatmentInPayload.date,
            mostRecentTreatmentInPayload.createdBy,
            mostRecentTreatmentInPayload.createdOn,
            mostRecentTreatmentInPayload.updatedBy,
            mostRecentTreatmentInPayload.updatedOn
          )
        } else {
          const mostRecentTreatmentOccurredCaptured = _.sortBy(
            payload.filter(fuv => fuv.fieldName === 'treatmentOccurred'),
            fuv => fuv.clientTime
          ).reverse()[0]
          await updateMostRecentResultFollowUp(
            mostRecentTreatmentInPayload.resultId,
            mostRecentTreatmentInPayload.externalId,
            mostRecentTreatmentOccurredCaptured?.value || mostRecentTreatmentInPayload.date,
            mostRecentTreatmentInPayload.updatedBy,
            mostRecentTreatmentInPayload.updatedOn || mostRecentTreatmentOccurredCaptured?.value
          )
        }
      } else {
        const mostRecentTreatmentOccurredCaptured = _.sortBy(
          payload.filter(fuv => fuv.fieldName === 'treatmentOccurred'),
          fuv => fuv.clientTime
        ).reverse()[0]
        await updateMostRecentResultFollowUp(
          mostRecentTreatmentInPayload.resultId,
          mostRecentTreatmentInPayload.externalId,
          mostRecentTreatmentOccurredCaptured?.value || mostRecentTreatmentInPayload.date,
          mostRecentTreatmentInPayload.updatedBy,
          mostRecentTreatmentInPayload.updatedOn || mostRecentTreatmentOccurredCaptured?.value
        )
      }
    }
    const mostRecentOutcomeInPayload = _.sortBy(
      standardFollowUpsInPayload.filter(fu => fu.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.outcome),
      fu => fu.updatedBy
    ).reverse()[0]
    if (mostRecentOutcomeInPayload) {
      const existingOutcomeAfter = _.sortBy(
        resultEntry.followUps.filter(
          fu =>
            fu.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.outcome &&
            fu.updatedOn.toISOString() >= mostRecentOutcomeInPayload.updatedOn.toISOString()
        ),
        fu => fu.updatedOn
      )[0]
      if (
        !existingOutcomeAfter &&
        (resultEntry.clinicalResponse.outcome !== mostRecentOutcomeInPayload.externalId ||
          (resultEntry.clinicalResponse.outcomeOccurred?.toISOString() || '') !==
            (mostRecentOutcomeInPayload.date?.toISOString() || ''))
      ) {
        if (mostRecentOutcomeInPayload.externalId === null) {
          await deleteResultFollowUps(
            mostRecentOutcomeInPayload.resultId,
            mostRecentOutcomeInPayload.followUpTypeExternalId,
            mostRecentOutcomeInPayload.updatedBy
          )
        } else if (resultEntry.clinicalResponse.outcome !== mostRecentOutcomeInPayload.externalId) {
          const followUp = await getFollowUpByExternalId(mostRecentOutcomeInPayload.externalId)
          await addResultFollowUp(
            mostRecentOutcomeInPayload.resultId,
            mostRecentOutcomeInPayload.externalId,
            followUp.id,
            mostRecentOutcomeInPayload.date,
            mostRecentOutcomeInPayload.createdBy,
            mostRecentOutcomeInPayload.createdOn,
            mostRecentOutcomeInPayload.updatedBy,
            mostRecentOutcomeInPayload.updatedOn
          )
        } else {
          await updateMostRecentResultFollowUp(
            mostRecentOutcomeInPayload.resultId,
            mostRecentOutcomeInPayload.externalId,
            mostRecentOutcomeInPayload.date,
            mostRecentOutcomeInPayload.updatedBy
          )
        }
      }
    }
    // If the result has been marked as follow-up not possible
    const mostRecentNotPossibleValueCaptured = _.sortBy(
      payload.filter(fuv => fuv.fieldName === NOT_POSSIBLE_FIELD_NAME),
      fuv => fuv.clientTime
    ).reverse()[0]

    if (mostRecentValueCaptured) {
      resultEntry = await showResult(resultId, dataConstraints)
    }

    const notPossibleReasonValueCaptured = _.sortBy(
      payload.filter(fuv => fuv.fieldName === NOT_POSSIBLE_REASON_FIELD_NAME),
      fuv => fuv.clientTime
    ).reverse()[0]

    const followUpNotPossibleExist = await getFollowUpsNotPossibleByResultById(resultId)

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
          const notPossibleReasonValue = notPossibleReasonValueCaptured || {
            value: null,
            clientTime: mostRecentNotPossibleValueCaptured.clientTime,
          }

          if (_.isEmpty(followUpNotPossibleExist)) {
            const followUp = await getFollowUpByExternalId(NOT_POSSIBLE_FOLLOW_UP_TYPE)
            await addResultFollowUp(
              resultId,
              NOT_POSSIBLE_FOLLOW_UP_TYPE,
              followUp.id,
              mostRecentNotPossibleValueCaptured.clientTime,
              currentUserId,
              mostRecentNotPossibleValueCaptured.clientTime,
              currentUserId,
              mostRecentNotPossibleValueCaptured.clientTime
            )

            await flagResult(
              resultId,
              currentUserId,
              notPossibleReasonValue.value,
              mostRecentNotPossibleValueCaptured.clientTime
            )

            // delete follow up treatment
            await deleteResultFollowUpTreatment(resultId, currentUserId, mostRecentNotPossibleValueCaptured.clientTime)
          }
          resultEntry = await showResult(resultId, dataConstraints)
        }
      } else {
        await deleteResultFollowUpNotPossible(resultId, mostRecentNotPossibleValueCaptured.clientTime)
        await unflagResult(resultId, currentUserId, mostRecentNotPossibleValueCaptured.clientTime)
        resultEntry = await showResult(resultId, dataConstraints)
      }
    }

    if (followUpNotPossibleExist && notPossibleReasonValueCaptured) {
      await updateResultFollowUp(followUpNotPossibleExist.resultFollowUpId, notPossibleReasonValueCaptured.clientTime)
      await flagResult(
        resultId,
        currentUserId,
        notPossibleReasonValueCaptured.value,
        notPossibleReasonValueCaptured.clientTime
      )
    }
    const resultFollowUps = await getFollowUpsOfResultById(resultId)
    const latestTreatment =
      _.sortBy(
        resultFollowUps.filter(rfu => rfu.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.treatment),
        rfu => rfu.updatedOn
      ).reverse()[0] || {}
    const expectedTreatmentStatus =
      resultEntry.resultRequiresTreatment && !latestTreatment.externalId
        ? 'AwaitingTreatment'
        : resultEntry.resultRequiresTreatment &&
          latestTreatment.externalId &&
          latestTreatment.externalId !== NOT_POSSIBLE_FOLLOW_UP_TYPE
        ? 'OnTreatment'
        : latestTreatment.externalId === NOT_POSSIBLE_FOLLOW_UP_TYPE
        ? 'NotPossible'
        : null
    if (resultEntry.treatmentStatus?.externalId !== expectedTreatmentStatus) {
      if (expectedTreatmentStatus) {
        await updateTreatmentStatusByResultId(
          currentUserId,
          mostRecentValueCaptured.clientTime,
          resultId,
          expectedTreatmentStatus,
          mostRecentValueCaptured.clientTime
        )
      } else {
        await updateResult(resultId, null, currentUserId, mostRecentValueCaptured.clientTime)
      }
    }
    resultEntry = await showResult(resultId, dataConstraints)
  }
  return {
    ok: !!resultEntry,
    data: resultEntry,
  }
}

const FLAGGED_EXTERNALID = 'Flagged'
const PURGED_EXTERNALID = 'Purged'
const DELIVERED_EXTERNALID = 'Delivered'

async function flagResult(resultId, currentUserId, reason, date) {
  const flaggedId = await resultWorkflowStatusToId(FLAGGED_EXTERNALID)
  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: flaggedId,
    createdBy: currentUserId,
    reason,
    changedOn: date,
  }
  const errorMessage = await updateNotPossibleWorkflowStatusByResultId(resultWorkflowLogEntry)
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
  return showResult(resultId, dataConstraints)
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

async function getPossibleReasonsForNoResult(resultId) {
  const [result] = await getBaseQueryForResults()
    .modify(qb => {
      qb.where('r.id', resultId)
    })
    .select(
      'r.id',
      'd.id as deviceId',
      'sp.id as sampleId',
      'g.id as geographyId',
      'c.id as countryId',
      'a.id as assayId',
      'at.id as assayTypeId',
      'dt.id as deviceTypeId'
    )
  if (!result) {
    return Boom.notFound('No results found')
  }
  if (!result.deviceId) {
    return Boom.notFound('No results found. The linked device appears to be missing.')
  }
  if (!result.sampleId) {
    return Boom.notFound('No results found. The linked sample appears to be missing.')
  }
  if (!result.geographyId) {
    return Boom.notFound('No results found. The linked geography appears to be missing.')
  }
  if (!result.countryId) {
    return Boom.notFound('No results found. The linked country appears to be missing.')
  }
  if (!result.assayId) {
    return Boom.notFound('No results found. The linked assay appears to be missing.')
  }
  if (!result.assayTypeId) {
    return Boom.notFound('No results found. The linked assay type appears to be missing.')
  }
  if (!result.deviceTypeId) {
    return Boom.notFound('No results found. The linked device type appears to be missing.')
  }
  return Boom.notFound('No results found')
}

// generate result
async function showResult(resultId, dataConstraints) {
  const myResultQuery = generateResultQueryV2(false, dataConstraints, resultId)
  // return result when both queries are finished
  const [data] = await getItemsV2(myResultQuery, resultId)
  if (!data) return getPossibleReasonsForNoResult(resultId)
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
