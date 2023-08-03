const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { transformGeographyFromUpdates } = require('../geography/service')
const { normalizeSiteParameters } = require('./common/logic')
const { getUserFromCredentials } = require('../auth/constraints')
const { getExistingSite } = require('./common/db')
const { throwExistingSiteError } = require('./common/validations')
const { canEdit } = require('../auth/constraints')
const { updateTagsById } = require('../tag/service')

module.exports = async function (request) {
  const {
    payload: { tags, ...payload },
    auth,
  } = request
  const tagType = 'site'

  if (tags && !canEdit(auth, `${tagType}:`)) {
    return Boom.forbidden(`You are not permitted to update tags to this ${tagType}`)
  }

  await validate(payload)

  const user = await getUserFromCredentials(auth.credentials)

  if (!user) {
    return Boom.badRequest('Cannot retrieve user from create site request')
  }

  const siteParams = await normalizeParameters(payload, user.countryId)

  const values = {
    ...siteParams,
    externalId: siteParams.externalId || siteParams.name,
    partnerId: user.partnerId,
    createdOn: new Date(),
    createdBy: user.id,
    updatedOn: new Date(),
    updatedBy: user.id,
  }

  const [newId] = await knex('Site').insert(values)

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
