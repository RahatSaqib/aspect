const Boom = require('@hapi/boom')
const { insertSite, insertSiteConsumables } = require('./common/db')
const { knex } = require('../db')
const { transformGeographyFromUpdates } = require('../geography/service')
const { normalizeSiteParameters } = require('./common/logic')
const { getUserFromCredentials } = require('../auth/constraints')
const { getExistingSite } = require('./common/db')
const { throwExistingSiteError } = require('./common/validations')
const { updateTagsById } = require('../tag/service')
const { SITE_TYPE_EXTERNAL_IDS } = require('../shared/constants')

module.exports = async function (request) {
  const {
    payload: { tags, ...payload },
    auth,
  } = request
  const tagType = 'site'

  await validate(payload)

  const user = await getUserFromCredentials(auth.credentials)

  if (!user) {
    return Boom.badRequest('Cannot retrieve user from create site request')
  }

  const siteParams = await normalizeParameters(payload, user.countryId)

  // Convert siteTypeExternalId to siteTypeId if provided
  if (siteParams.siteTypeExternalId && !siteParams.siteTypeId) {
    const siteType = await knex('SiteType').where('externalId', siteParams.siteTypeExternalId).first('id')
    if (siteType) {
      siteParams.siteTypeId = siteType.id
    }
    delete siteParams.siteTypeExternalId
  }

  // Set default value for sampleRegistrationAllowed based on site type
  if (siteParams.sampleRegistrationAllowed === undefined || siteParams.sampleRegistrationAllowed === null) {
    const clinicSiteType = await knex('SiteType').where('externalId', SITE_TYPE_EXTERNAL_IDS.CLINIC).first('id')
    siteParams.sampleRegistrationAllowed = siteParams.siteTypeId === clinicSiteType?.id
  }

  const values = {
    ...siteParams,
    externalId: siteParams.externalId || siteParams.name,
    partnerId: user.partnerId,
    createdOn: new Date(),
    createdBy: user.id,
    updatedOn: new Date(),
    updatedBy: user.id,
  }

  const [newId] = await insertSite(knex, values)

  if (payload.consumableIds) {
    await insertSiteConsumables(newId, payload.consumableIds)
  }

  await updateTagsById(newId, tagType, tags, auth)

  return newId
}

async function normalizeParameters(payload, countryId) {
  const payloadWithGeographyId = await transformGeographyFromUpdates(payload, countryId)
  return normalizeSiteParameters(payloadWithGeographyId)
}

const validate = async site => {
  await validateSiteNotExists(site)
}

async function validateSiteNotExists({ name, shortName, externalId }) {
  const existingSite = await getExistingSite(name, shortName, externalId)

  if (existingSite) {
    throwExistingSiteError(name, shortName, externalId, existingSite)
  }
}
