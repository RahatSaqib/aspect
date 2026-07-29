const Boom = require('@hapi/boom')

const { knex } = require('../db')
const { randomToken } = require('../deviceApi/apiKey')

async function createDeviceApiKey(request) {
  const { auth } = request
  const now = new Date()
  const user = await knex('Person as p')
    .join('User as u', 'u.id', 'p.userId')
    .where('u.name', auth.credentials.name)
    .first('u.id', 'p.lastPartnerId as partnerId', 'p.geographyId')

  if (user == null || user.partnerId == null) {
    return Boom.badRequest('Cannot find partner for user')
  }

  const apiKey = { token: randomToken() }
  await knex('DeviceApiKey').insert({
    token: apiKey.token,
    revoked: 0,
    geographyId: user.geographyId,
    partnerId: user.partnerId,
    createdOn: now,
    createdBy: user.id,
    updatedOn: now,
    updatedBy: user.id,
  })

  return apiKey
}

module.exports = {
  createDeviceApiKey,
}
