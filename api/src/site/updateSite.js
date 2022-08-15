const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { transformGeographyFromUpdates } = require('../geography/service')
const { normalizeSiteParameters } = require('./common/logic')
const { showSite } = require('./service')
const { getExistingSiteExcludingCurrent } = require('./common/db')

module.exports = async function (request) {
  const { auth, params, payload } = request

  const siteParams = await normalizeParameters(payload)

  try {
    await validate(params.siteId, auth.credentials, siteParams)
  } catch (error) {
    if (error instanceof Boom.Boom) {
      return error
    }
    throw error
  }

  await updateSite(params.siteId, siteParams)

  const site = await showSite(request)

  return site
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

  const checkSite = await knex('Site as s')
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, { site: 's' })
    .first('s.id')

  if (!checkSite) {
    throw Boom.notFound('Site not found')
  }
}

async function validateNonRepeatedSite(siteId, { name, shortName, externalId }) {
  const existingSite = await getExistingSiteExcludingCurrent(siteId, name, shortName, externalId)

  if (existingSite) {
    let message = name === existingSite.name ? `A site with the name (${name}) already exists.\n` : ''
    message += shortName === existingSite.shortName ? `A site with the shortName (${shortName}) already exists.\n` : ''
    message += externalId === existingSite.externalId ? `A site with site Id (${externalId}) already exists.\n` : ''

    throw Boom.conflict(message)
  }
}

async function updateSite(siteId, params) {
  await knex('Site as s').where('s.id', siteId).update(params)
}
