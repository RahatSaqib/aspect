const Boom = require('@hapi/boom')
const { getConstraints } = require('../auth/constraints')
const { transformGeographyFromUpdates } = require('../geography/service')
const { normalizeSiteParameters } = require('./common/logic')
const { getExistingSiteExcludingCurrent, updateSite, checkSiteAccess } = require('./common/db')
const { throwExistingSiteError } = require('./common/validations')

module.exports = async function (request) {
  const { auth, params, payload } = request
  const siteParams = await normalizeParameters(payload)

  await validate(params.siteId, auth.credentials, siteParams)

  await updateSite(params.siteId, siteParams)

  return params.siteId
}

async function normalizeParameters(payload) {
  const payloadWithGeographyId = await transformGeographyFromUpdates(payload)
  return normalizeSiteParameters(payloadWithGeographyId)
}

const validate = async (siteId, credentials, site) => {
  await validateConstraints(siteId, credentials)
  await validateNonRepeatedSite(siteId, site)
}

async function validateConstraints(siteId, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const checkSite = await checkSiteAccess(siteId, dataConstraints)

  if (!checkSite) {
    throw Boom.notFound('Site not found')
  }
}

async function validateNonRepeatedSite(siteId, { name, shortName, externalId }) {
  const existingSite = await getExistingSiteExcludingCurrent(siteId, name, shortName, externalId)
  if (existingSite) {
    throwExistingSiteError(name, shortName, externalId, existingSite)
  }
}
