const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { getConstraints, getUserFromCredentials } = require('../auth/constraints')
const { transformGeographyFromUpdates } = require('../geography/service')
const { normalizeSiteParameters } = require('./common/logic')
const {
  getExistingSiteExcludingCurrent,
  updateSite,
  updateSiteConsumable,
  updateSiteConsumablesBatch,
  checkSiteAccess,
  getSiteTypeIdByExternalId,
} = require('./common/db')
const { throwExistingSiteError } = require('./common/validations')
const { updateTagsById } = require('../tag/service')

async function updateConsumable(request) {
  const { auth, params, payload } = request
  await validateConstraints(params.siteId, auth.credentials)
  await updateSiteConsumable(knex, params.siteId, payload)
  return { ok: true }
}

async function updateConsumablesBatch(request) {
  const { auth, params, payload } = request
  await validateConstraints(params.siteId, auth.credentials)
  await updateSiteConsumablesBatch(knex, params.siteId, payload)
  return { ok: true }
}

async function update(request) {
  const {
    auth,
    params,
    payload: { tags, ...payload },
  } = request

  const tagType = 'site'

  const user = await getUserFromCredentials(auth.credentials)

  const siteParams = await normalizeParameters(payload, user.countryId)

  await validate(params.siteId, auth.credentials, siteParams)

  await updateSite(params.siteId, siteParams)

  await updateTagsById(params.siteId, tagType, tags, auth)

  return params.siteId
}

async function normalizeParameters(payload, countryId) {
  const payloadWithGeographyId = await transformGeographyFromUpdates(payload, countryId)
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

module.exports = {
  update,
  updateConsumable,
  updateConsumablesBatch,
}
