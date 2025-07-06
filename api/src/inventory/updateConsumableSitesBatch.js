const { knex } = require('../db')
const { updateConsumableSitesBatch } = require('./common/db')
const { validateConstraints } = require('../auth/constraints')

async function updateConsumableSitesBatchHandler(request) {
  const { auth, params, payload } = request
  // For this endpoint, we need to validate access to all sites
  const { siteIds } = payload
  const validationPromises = siteIds.map(siteId => validateConstraints(siteId, auth.credentials))
  await Promise.all(validationPromises)
  await updateConsumableSitesBatch(knex, params.consumableId, payload)
  return { ok: true }
}

module.exports = updateConsumableSitesBatchHandler
