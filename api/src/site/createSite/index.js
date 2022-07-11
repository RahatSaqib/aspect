const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const validate = require('./createSiteValidator')
const { transformGeographyFromUpdates } = require('../../geography/service')
const { normalizeSiteParameters } = require('../common/index')
const { getUserFromCredentials } = require('../../auth/constraints')

module.exports = async function (request) {
  const { payload, auth } = request

  const errors = await validate(payload)

  if (errors.length > 0) {
    throw Boom.badRequest(errors)
  }

  const user = await getUserFromCredentials(auth.credentials)

  if (!user) {
    throw Boom.badImplementation(
      'Cannot retrieve user from create site request'
    )
  }

  const payloadWithGeographyId = await transformGeographyFromUpdates(payload)

  const siteParams = await normalizeSiteParameters(payloadWithGeographyId)

  const values = {
    ...siteParams,
    partnerId: user.partnerId,
    createdOn: new Date(),
    createdBy: user.id,
    updatedOn: new Date(),
    updatedBy: user.id,
  }

  return knex('Site').insert(values)
}
