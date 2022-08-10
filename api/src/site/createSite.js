const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { transformGeographyFromUpdates } = require('../geography/service')
const { normalizeSiteParameters } = require('./common/index')
const { getUserFromCredentials } = require('../auth/constraints')
const { getExistingSite } = require('./common/db')

module.exports = async function (request) {
  const { payload, auth } = request

  try {
    await validate(payload)
  } catch (error) {
    if (error instanceof Boom.Boom) {
      return error
    }
    throw error
  }

  const user = await getUserFromCredentials(auth.credentials)

  if (!user) {
    return Boom.badRequest('Cannot retrieve user from create site request')
  }

  const siteParams = await normalizeParameters(payload)

  const values = {
    ...siteParams,
    externalId: siteParams.externalId || siteParams.name,
    partnerId: user.partnerId,
    createdOn: new Date(),
    createdBy: user.id,
    updatedOn: new Date(),
    updatedBy: user.id,
  }

  const [insertedId] = await knex('Site').insert(values)
  console.log('\x1b[1;36m', '🚀 ➜ file: createSite.js ➜ line 34 ➜ insertedId', insertedId)

  return { ok: true, data: { id: insertedId } }
}

async function normalizeParameters(payload) {
  const payloadWithGeographyId = await transformGeographyFromUpdates(payload)
  return normalizeSiteParameters(payloadWithGeographyId)
}

const validate = async site => {
  await validateSiteNotExists(site)
}

async function validateSiteNotExists({ name, shortName, externalId }) {
  const existingSite = await getExistingSite(name, shortName, externalId)

  if (existingSite) {
    let message = name === existingSite.name ? `A site with the name (${name}) already exists.\n` : ''
    message += shortName === existingSite.shortName ? `A site with the shortName (${shortName}) already exists.\n` : ''
    message += externalId === existingSite.externalId ? `A site with site Id (${externalId}) already exists.\n` : ''

    throw Boom.conflict(message)
  }
}
