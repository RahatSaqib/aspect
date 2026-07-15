const Boom = require('@hapi/boom')

const { knex } = require('../db')
const { getUserFromCredentials } = require('../auth/constraints')

async function revokeDeviceApiKey(request) {
  const { params, payload, auth } = request
  const user = await getUserFromCredentials(auth.credentials)

  const updatedCount = await knex('DeviceApiKey').where('id', params.deviceApiKeyId).update({
    revoked: payload.revoked,
    updatedOn: new Date(),
    updatedBy: user.id,
  })

  if (updatedCount !== 1) {
    return Boom.badRequest()
  }

  return {
    ok: true,
    data: {
      id: params.deviceApiKeyId,
      revoked: payload.revoked,
    },
  }
}

module.exports = {
  revokeDeviceApiKey,
}
