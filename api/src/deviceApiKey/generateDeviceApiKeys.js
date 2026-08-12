const _ = require('lodash')
const Boom = require('@hapi/boom')

const { knex } = require('../db')
const { randomToken } = require('../deviceApi/apiKey')
const { getUser } = require('../auth/service')

async function generateDeviceApiKeys(request) {
  const { auth, payload } = request

  const now = new Date()
  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const { partnerId } = currentlyLoggedInUser

  if (!partnerId) {
    return Boom.badRequest('Cannot find partner for user')
  }

  const deviceApiKeys = _.times(payload.count).map(() => ({
    token: randomToken(),
    revoked: 0,
    siteId: payload.siteId,
    partnerId,
    createdOn: now,
    createdBy: currentlyLoggedInUser.id,
    updatedOn: now,
    updatedBy: currentlyLoggedInUser.id,
  }))

  await knex('DeviceApiKey').insert(deviceApiKeys)

  return { ok: true }
}

module.exports = {
  generateDeviceApiKeys,
}
