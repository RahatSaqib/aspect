const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { getSite } = require('../../site/service')
const { knex } = require('../../db')
const {
  getSitePartnerId,
  lockPartnerSites,
  getFormDataByPartnerExternalId,
  getFormDataBySiteAndSample,
  insertFormData,
  updateFormData,
} = require('./db')

/**
 * Upsert custom fields into FormData.
 * When externalId is present it is the primary match key, otherwise the row is matched by siteId + sampleExternalId.
 */
async function upsertCustomFields(request) {
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

  try {
    await knex.transaction(async trx => {
      const partnerId = await getSitePartnerId(trx, siteId)

      await lockPartnerSites(trx, partnerId)

      const existingByExternalId = externalId ? await getFormDataByPartnerExternalId(trx, partnerId, externalId) : null
      const existingBySiteAndSample = await getFormDataBySiteAndSample(trx, siteId, sampleExternalId)

      validateConflicts({ existingByExternalId, existingBySiteAndSample, siteId, sampleExternalId, externalId })

      const recordToUpdate = existingByExternalId || existingBySiteAndSample
      const formDataToSave = {
        siteId,
        resultId: null,
        sampleExternalId,
        externalId: externalId || _.get(recordToUpdate, 'externalId', null),
        data: JSON.stringify({ customFieldsData: payload.customFieldsData }),
        collectedOn: payload.collectedOn,
        updatedOn: now,
        updatedBy: currentlyLoggedInUser.id,
      }

      if (recordToUpdate) {
        await updateFormData(trx, recordToUpdate.id, formDataToSave)
        return
      }

      await insertFormData(trx, {
        ...formDataToSave,
        createdOn: now,
        createdBy: currentlyLoggedInUser.id,
      })
    })
  } catch (error) {
    if (error.isBoom) {
      throw error
    }

    if (error.code === 'ER_DUP_ENTRY') {
      throw Boom.conflict('The provided site and sample combination is already linked to another custom fields record.')
    }

    throw error
  }

  return { ok: true }
}

function validateConflicts({ existingByExternalId, existingBySiteAndSample, externalId }) {
  if (existingByExternalId && existingBySiteAndSample && existingByExternalId.id !== existingBySiteAndSample.id) {
    throw Boom.conflict('The provided site and sample combination is already linked to a different externalId.')
  }

  if (
    existingBySiteAndSample &&
    externalId &&
    existingBySiteAndSample.externalId &&
    existingBySiteAndSample.externalId !== externalId
  ) {
    if (!existingByExternalId || existingByExternalId.id !== existingBySiteAndSample.id) {
      throw Boom.conflict('The provided site and sample combination is already linked to a different externalId.')
    }
  }
}

function normalizeOptionalString(value) {
  if (_.isNil(value)) {
    return null
  }

  if (!_.isString(value)) {
    return value
  }

  const trimmedValue = value.trim()
  return trimmedValue === '' ? null : trimmedValue
}

module.exports = { upsertCustomFields }
