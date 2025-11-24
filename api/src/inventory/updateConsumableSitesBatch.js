const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { updateConsumableSitesBatch } = require('./common/db')
const { getConstraints } = require('../auth/constraints')
const { checkSitesAccess } = require('../site/common/db')

async function validateConstraints(siteIds, credentials) {
  const dataConstraints = await getConstraints(credentials)
  const accessibleCount = await checkSitesAccess(siteIds, dataConstraints)

  if (accessibleCount !== siteIds.length) {
    throw Boom.notFound('Sites not found')
  }
}

async function updateConsumableSitesBatchHandler(request) {
  const { auth, params, payload } = request
  // For this endpoint, we need to validate access to all sites
  const { siteIds } = payload
  await validateConstraints(siteIds, auth.credentials)
  await updateConsumableSitesBatch(knex, params.consumableId, payload)
  return { ok: true }
}

module.exports = updateConsumableSitesBatchHandler
