const Boom = require('@hapi/boom')
const _ = require('lodash')
const { Promise } = require('bluebird')
const { getUser } = require('../../auth/service')
const {
  getResultItemTransformedDataV2,
  fieldNameToFollowUpTypeIdMappings,
  NOT_POSSIBLE_FOLLOW_UP_TYPE,
} = require('./common/logic')
const { getConstraints } = require('../../auth/constraints')
const { resultTreatmentStatusToId, allResultCategoryToId } = require('../../shared/dictionary')
const {
  getFollowUpByExternalId,
  getLastTreatmentStatusByResult,
  setTreatmentStatusLog,
  updateResult,
  addResultFollowUp,
  deleteResultFollowUpNotPossible,
  deleteResultFollowUps,
  getFollowUpsOfResultById,
  getItemsV2,
  updateMostRecentResultFollowUp,
  getFollowUpsNotPossibleByResultById,
  updateResultFollowUp,
  deleteResultFollowUpTreatment,
} = require('./common/db')
const { fetchResultsQuery } = require('../entries/result/common/db')
const { knex } = require('../../db')
const { getFormsByFormDefinitionExternalIds } = require('../../forms/service')
const { getBaseQueryForResults } = require('../../result/common/db')

const ACKNOWLEDGED_FIELD_NAME = 'confirmed'
const NOT_POSSIBLE_FIELD_NAME = 'followUpNotPossible'
const NOT_POSSIBLE_REASON_FIELD_NAME = 'followUpNotPossibleReason'

async function clinicalResponse(request) {
  const {
    auth: { credentials },
    payload: payloadRaw,
    params,
  } = request

  const payload = payloadRaw.filter(fuv => fuv.fieldType !== 'custom-field')
  const customFields = payloadRaw.filter(fuv => fuv.fieldType === 'custom-field')

  const { resultId } = params
  const { id: currentUserId, partnerId } = await getUser(credentials.name)
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
    if (confirmedValueCaptured) {
      if (confirmedValueCaptured.value) {
        resultEntry = await showResult(resultId, dataConstraints)
      } else {
        resultEntry = await showResult(resultId, dataConstraints)
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
      if (!existingTreatmentAfter) {
        if (mostRecentTreatmentInPayload.externalId === null) {
          await deleteResultFollowUps(
            mostRecentTreatmentInPayload.resultId,
            mostRecentTreatmentInPayload.followUpTypeExternalId,
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
      if (!existingOutcomeAfter) {
        if (mostRecentOutcomeInPayload.externalId === null) {
          await deleteResultFollowUps(
            mostRecentOutcomeInPayload.resultId,
            mostRecentOutcomeInPayload.followUpTypeExternalId,
            mostRecentOutcomeInPayload.updatedBy
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

            // delete follow up treatment
            await deleteResultFollowUpTreatment(resultId, currentUserId, mostRecentNotPossibleValueCaptured.clientTime)
          }
          resultEntry = await showResult(resultId, dataConstraints)
        }
      } else {
        await deleteResultFollowUpNotPossible(resultId, mostRecentNotPossibleValueCaptured.clientTime)
        resultEntry = await showResult(resultId, dataConstraints)
      }
    }

    if (followUpNotPossibleExist && notPossibleReasonValueCaptured) {
      await updateResultFollowUp(followUpNotPossibleExist.resultFollowUpId, notPossibleReasonValueCaptured.clientTime)
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

  if (customFields.length > 0) {
    const forms = await getFormsByFormDefinitionExternalIds(
      partnerId,
      customFields.map(fuv => fuv.formDefinitionExternalId)
    )

    if (forms.length !== 0) {
      const customFieldsByFormDefinitionExternalId = {}
      customFields.forEach(fuv => {
        if (!customFieldsByFormDefinitionExternalId[fuv.formDefinitionExternalId]) {
          customFieldsByFormDefinitionExternalId[fuv.formDefinitionExternalId] = {}
        }
        customFieldsByFormDefinitionExternalId[fuv.formDefinitionExternalId][fuv.fieldName] = { value: fuv.value }
      })

      await Promise.map(
        Object.entries(customFieldsByFormDefinitionExternalId),
        async ([formDefinitionExternalId, customFieldsData]) => {
          await knex('ResultCustomField')
            .insert({
              resultId,
              formDefinitionExternalId,
              customFieldsData,
            })
            .onConflict(['resultId', 'formDefinitionExternalId'])
            .merge()
        }
      )
    }
  }

  return {
    ok: !!resultEntry,
    data: resultEntry,
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
  const resultCategoryToId = await allResultCategoryToId()
  const myResultQuery = fetchResultsQuery(
    {
      resultId,
      ignoredResultCategories: [resultCategoryToId.Invalid, resultCategoryToId.Error, resultCategoryToId.NoResult],
    },
    dataConstraints
  )
  // return result when both queries are finished
  const [data] = await getItemsV2(myResultQuery, resultId)
  if (!data) return getPossibleReasonsForNoResult(resultId)
  // get follow-ups for all result in the response for performance (filter later)
  const followUps = await getFollowUpsOfResultById(resultId)
  const result = await getResultItemTransformedDataV2(data, true, followUps)
  return result || Boom.notFound()
}

module.exports = {
  clinicalResponse,
}
