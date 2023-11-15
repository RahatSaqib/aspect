const Boom = require('@hapi/boom')
const { knex } = require('../db')

async function updateRefreshToken(request) {
  const { params, payload } = request
  const selectedToken = await knex('RefreshToken').where('clientId', params.refreshTokenId).update({
    revoked: payload.revoked,
  })

  if (selectedToken !== 1) {
    return Boom.notFound()
  }

  return {
    ok: true,
    data: {
      id: params.refreshTokenId,
      revoked: payload.revoked,
    },
  }
}

module.exports = {
  updateRefreshToken,
}
