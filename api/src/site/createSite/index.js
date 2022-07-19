const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const validate = require('./createSiteValidator')
const { transformGeographyFromUpdates } = require('../../geography/service')
const { normalizeSiteParameters } = require('../common/index')
const { getUserFromCredentials } = require('../../auth/constraints')

module.exports = async function (request) {
  const { payload, auth } = request

  await validate(payload)

  const user = await getUserFromCredentials(auth.credentials)

  if (!user) {
    throw Boom.badRequest('Cannot retrieve user from create site request')
  }

  const payloadWithGeographyId = await transformGeographyFromUpdates(payload)

  const siteParams = normalizeSiteParameters(payloadWithGeographyId)

  const values = {
    ...siteParams,
    externalId: siteParams.name,
    partnerId: user.partnerId,
    createdOn: new Date(),
    createdBy: user.id,
    updatedOn: new Date(),
    updatedBy: user.id,
  }

  const [insertedId] = await knex('Site').insert(values)

  return { ok: true, data: { id: insertedId } }
}
