const Boom = require('@hapi/boom')

const { knex } = require('../db')

async function revokeDeviceApiKey(request) {
  const { params, payload } = request

  const updatedCount = await knex('DeviceApiKey').where('id', params.deviceApiKeyId).update({
    revoked: payload.revoked,
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
