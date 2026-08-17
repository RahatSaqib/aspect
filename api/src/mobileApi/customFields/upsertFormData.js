const _ = require('lodash')
const Boom = require('@hapi/boom')
const logger = require('../../shared/logger')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { getSite } = require('../../site/service')
const { knex } = require('../../db')
const {
  getSitePartnerId,
  getFormDataByPartnerExternalId,
  getFormDataBySiteAndSample,
  insertFormData,
  updateFormData,
} = require('./db')
const { normalizeOptionalString } = require('./normalizeSampleExternalId')
const { syncFormDataToResult } = require('./syncFormDataToResult')

/**
 * Picks a single Result id suitable for linking to FormData: same site, sample external id,
 * not already referenced by any FormData row. Chooses the result whose `startedOn` is closest to
 * `collectedOn` (both are required in our model; Knex returns them as Date instances). Ties use
 * `endedOn` then `id` (see `pickResultIdByEndedOnFallback`). If `collectedOn` is missing or
 * invalid in the request, falls back to `endedOn` ordering only.
 */
async function selectCandidateResultIdForSiteAndSample(trx, { siteId, sampleExternalId, collectedOn }) {
  if (sampleExternalId == null || siteId == null) {
    return null
  }

  const rows = await trx('Result as r')
    .join('Sample as s', 's.id', 'r.sampleId')
    .where('r.siteId', siteId)
    .where('s.externalId', sampleExternalId)
    .whereNotNull('r.sampleId')
    .whereNotNull('r.siteId')
    .whereNotNull('r.startedOn')
    .whereNotExists(trx('FormData as fd').select(trx.raw('1')).whereRaw('fd.resultId = r.id'))
    .select('r.id', 'r.startedOn', 'r.endedOn')

  return pickCandidateResultId(rows, collectedOn)
}

/**
 * Picks the result whose `startedOn` is closest to `collectedOn`.
 */
function pickCandidateResultId(rows, collectedOn) {
  if (!rows.length) {
    return null
  }

  const collectedMs = new Date(collectedOn).getTime()
  if (Number.isNaN(collectedMs)) {
    return pickResultIdByEndedOnFallback(rows).id
  }

  const startedMs = row => new Date(row.startedOn).getTime()

  const closestMatchingResult = rows.reduce((closest, current) => {
    const currentDiff = Math.abs(startedMs(current) - collectedMs)
    const closestDiff = Math.abs(startedMs(closest) - collectedMs)
    if (currentDiff < closestDiff) {
      return current
    }
    if (currentDiff > closestDiff) {
      return closest
    }
    return pickResultIdByEndedOnFallback([current, closest])
  })

  return closestMatchingResult.id
}

/** Matches SQL: (r.endedOn IS NULL) ASC, r.endedOn DESC, r.id DESC */
function pickResultIdByEndedOnFallback(rows) {
  return rows.slice().sort((a, b) => {
    const aHasEnded = a.endedOn != null
    const bHasEnded = b.endedOn != null
    if (aHasEnded && !bHasEnded) {
      return -1
    }
    if (!aHasEnded && bHasEnded) {
      return 1
    }
    if (aHasEnded && bHasEnded) {
      const diff = new Date(b.endedOn) - new Date(a.endedOn)
      if (diff !== 0) {
        return diff
      }
    }
    return b.id - a.id
  })[0]
}

/**
 * Upsert a FormData row (custom fields payload for a sample).
 * When externalId is present it is the primary match key, otherwise the row is matched by siteId + sampleExternalId.
 */
async function upsertFormData(request) {
  const { payload, auth } = request
  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  const site = await getSite(payload.originSiteId, dataConstraints)
  if (_.isEmpty(site)) {
    throw Boom.forbidden('Unauthorised Origin Site')
  }

  const siteId = payload.originSiteId
  const sampleExternalId = normalizeOptionalString(payload.sampleExternalId)
  const externalId = normalizeOptionalString(payload.externalId)
  const now = new Date()

  logger.info({
    message: 'upsertFormData: Processing custom fields submission',
    siteId,
    sampleExternalId,
    externalId,
    userId: currentlyLoggedInUser.id,
  })

  try {
    await knex.transaction(async trx => {
      const partnerId = await getSitePartnerId(trx, siteId)

      const existingByExternalId = externalId ? await getFormDataByPartnerExternalId(trx, partnerId, externalId) : null
      const existingBySiteAndSample = await getFormDataBySiteAndSample(trx, siteId, sampleExternalId)

      validateConflicts({
        existingByExternalId,
        existingBySiteAndSample,
        siteId,
        sampleExternalId,
        externalId,
      })

      const recordToUpdate = existingByExternalId || existingBySiteAndSample
      validateSampleExternalIdImmutableWhenLinked(recordToUpdate, sampleExternalId)

      const collectedOnForLink = _.has(payload, 'collectedOn')
        ? payload.collectedOn
        : _.get(recordToUpdate, 'collectedOn')

      const resolvedResultId = await resolveResultIdForUpsert(trx, {
        siteId,
        sampleExternalId,
        recordToUpdate,
        collectedOn: collectedOnForLink,
      })

      const wasLinked = recordToUpdate && recordToUpdate.resultId != null
      let finalResultId = resolvedResultId

      if (resolvedResultId != null || wasLinked) {
        const targetResultId = wasLinked ? recordToUpdate.resultId : resolvedResultId
        const { synced } = await syncFormDataToResult(
          trx,
          {
            formDataRow: {
              id: recordToUpdate && recordToUpdate.id,
              data: JSON.stringify({ customFieldsData: payload.customFieldsData }),
            },
            resultId: targetResultId,
          },
          { isAlreadyLinked: wasLinked }
        )
        if (!wasLinked && !synced) {
          finalResultId = null
        } else if (wasLinked && !synced) {
          throw Boom.badRequest('Unable to sync custom fields to the linked result.')
        }
      }

      const formDataToSave = {
        siteId,
        resultId: finalResultId,
        sampleExternalId,
        externalId: externalId || _.get(recordToUpdate, 'externalId', null),
        data: JSON.stringify({ customFieldsData: payload.customFieldsData }),
        collectedOn: payload.collectedOn,
        updatedOn: now,
        updatedBy: currentlyLoggedInUser.id,
      }

      if (recordToUpdate) {
        await updateFormData(trx, recordToUpdate.id, formDataToSave)
        logger.info({
          message: 'FormData updated successfully',
          siteId,
          sampleExternalId,
          externalId,
          recordId: recordToUpdate.id,
          userId: currentlyLoggedInUser.id,
        })
        return
      }

      await insertFormData(trx, {
        ...formDataToSave,
        createdOn: now,
        createdBy: currentlyLoggedInUser.id,
      })
      logger.info({
        message: 'FormData created successfully',
        siteId,
        sampleExternalId,
        externalId,
        userId: currentlyLoggedInUser.id,
      })
    })
  } catch (error) {
    if (error.isBoom) {
      if (error.output.statusCode === 409) {
        logger.warning({
          message: 'FormData upsert failed with conflict',
          siteId,
          sampleExternalId,
          externalId,
          errorMessage: error.message,
          userId: currentlyLoggedInUser.id,
        })
      }
      throw error
    }

    if (error.code === 'ER_DUP_ENTRY') {
      logger.error({
        message: 'FormData upsert failed with duplicate entry',
        siteId,
        sampleExternalId,
        externalId,
        errorCode: error.code,
        userId: currentlyLoggedInUser.id,
      })
      throw Boom.conflict('The provided site and sample combination is already linked to another custom fields record.')
    }

    logger.error({
      message: 'FormData upsert failed with unexpected error',
      siteId,
      sampleExternalId,
      externalId,
      errorMessage: error.message,
      errorCode: error.code,
      userId: currentlyLoggedInUser.id,
    })
    throw error
  }

  return { ok: true }
}

function validateSampleExternalIdImmutableWhenLinked(recordToUpdate, sampleExternalId) {
  if (!recordToUpdate || recordToUpdate.resultId == null) {
    return
  }

  const previous = normalizeOptionalString(recordToUpdate.sampleExternalId)
  if (previous !== sampleExternalId) {
    throw Boom.conflict('sampleExternalId cannot change while this form is linked to a result.')
  }
}

async function resolveResultIdForUpsert(trx, { siteId, sampleExternalId, recordToUpdate, collectedOn }) {
  if (recordToUpdate?.resultId != null) {
    return recordToUpdate.resultId
  }

  if (sampleExternalId == null) {
    return null
  }

  return selectCandidateResultIdForSiteAndSample(trx, { siteId, sampleExternalId, collectedOn })
}

function validateConflicts({ existingByExternalId, existingBySiteAndSample, siteId, sampleExternalId, externalId }) {
  if (existingByExternalId && existingBySiteAndSample && existingByExternalId.id !== existingBySiteAndSample.id) {
    logger.warning({
      message: 'FormData conflict: Different records found by externalId and site+sample',
      siteId,
      sampleExternalId,
      externalId,
      recordIdByExternalId: existingByExternalId.id,
      recordExternalIdByExternalId: existingByExternalId.externalId,
      recordIdBySiteAndSample: existingBySiteAndSample.id,
      recordExternalIdBySiteAndSample: existingBySiteAndSample.externalId,
    })
    throw Boom.conflict('The provided site and sample combination is already linked to a different externalId.')
  }

  if (
    existingBySiteAndSample &&
    externalId &&
    existingBySiteAndSample.externalId &&
    existingBySiteAndSample.externalId !== externalId
  ) {
    if (!existingByExternalId || existingByExternalId.id !== existingBySiteAndSample.id) {
      logger.warning({
        message: 'FormData conflict: Site+sample already linked to different externalId',
        siteId,
        sampleExternalId,
        incomingExternalId: externalId,
        existingRecordId: existingBySiteAndSample.id,
        existingRecordExternalId: existingBySiteAndSample.externalId,
        existingByExternalIdFound: !!existingByExternalId,
      })
      throw Boom.conflict('The provided site and sample combination is already linked to a different externalId.')
    }
  }
}

module.exports = { upsertFormData }
