const { knex } = require('../../db')
const { transformGeographyFromUpdates } = require('../../geography/service')
const { normalizeSiteParameters } = require('../common/index')
const { showSite } = require('../service')

module.exports = async function (request) {
  const { params, payload } = request

  const payloadWithGeographyId = await transformGeographyFromUpdates(payload)

  const normalizedSiteParams = normalizeSiteParameters(payloadWithGeographyId)

  await knex('Site').where('id', params.siteId).update(normalizedSiteParams)

  const site = await showSite(request)
  return site
}
