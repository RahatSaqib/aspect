const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { getSite } = require('../../site/service')
const { knex } = require('../../db')

/**
 * Upsert custom fields into FormData: one record per sample (siteId + sampleExternalId).
 * The entire customFieldsData array is stored in FormData.data in a single call.
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
  const sampleExternalId = payload.sampleExternalId ?? null
  const now = new Date()
  try {
    await knex('FormData')
      .insert({
        siteId,
        resultId: null,
        sampleExternalId,
        data: { customFieldsData: payload.customFieldsData },
        collectedOn: payload.collectedOn,
        createdOn: now,
        createdBy: currentlyLoggedInUser.id,
        updatedOn: now,
        updatedBy: currentlyLoggedInUser.id,
      })
      .onConflict(['siteId', 'sampleExternalId'])
      .merge(['data', 'collectedOn', 'updatedOn', 'updatedBy'])
  } catch (error) {
    console.error(error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

module.exports = { upsertCustomFields }
