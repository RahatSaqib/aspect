const knex = require('knex')
const { transformGeographyFromUpdates } = require('../../geography/service')
const normalizeSiteParameters = require('../common')
const showSite = require('../service')
// const userService = require('../auth/service')

module.exports = async function (request) {
  const { params, payload } = request

  // TODO: check permission
  const payloadWithGeographyId = await transformGeographyFromUpdates(payload)
  const site = await normalizeSiteParameters(payloadWithGeographyId)

  const updatedCount = await knex('Site')
    .where('id', params.siteId)
    .update(site)

  if (updatedCount !== 1) {
    throw new Error('Unknown error')
  }

  const result = await showSite(request)
  return result
}
