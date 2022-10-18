const Boom = require('@hapi/boom')
const { getConstraints } = require('../auth/constraints')
const { transformGeographyFromUpdates } = require('../geography/service')
const { normalizeSiteParameters } = require('./common/logic')
const { getExistingSiteExcludingCurrent, updateSite, checkSiteAccess } = require('./common/db')

module.exports = async function (request) {
  const { auth, params, payload } = request

  const siteParams = await normalizeParameters(payload)

  try {
    await validate(params.siteId, auth.credentials, siteParams)
  } catch (error) {
    if (Boom.isBoom(error)) {
      return error
    }
    throw error
  }

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
    let message = name === existingSite.name ? `A site with the name '${name}' already exists. \n` : ''
    message += shortName === existingSite.shortName ? `A site with the shortName '${shortName}' already exists. \n` : ''
    message += externalId === existingSite.externalId ? `A site with siteId '${externalId}' already exists. \n` : ''

    throw Boom.conflict(message)
  }
}
