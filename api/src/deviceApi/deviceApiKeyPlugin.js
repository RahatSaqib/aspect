const Boom = require('boom')
const { knex } = require('../db')
const { version } = require('../../package.json')

function register(plugin, options, next) {
  plugin.auth.scheme('deviceApiKey', () => ({ authenticate }))
  next()
}

register.attributes = {
  name: 'deviceApiKeyAuth',
  version
}


function authenticate(request, reply) {
  const { query, headers } = request
  let token = null
  if (query.token) {
    // prefer token in query string
    token = query.token
  } else if (headers.authorization) {
    // Remove Bearer from Authorization header
    token = headers.authorization.replace(/Bearer/gi, '')
  }

  // Remove whitespace
  token = token.replace(/ /g, '')

  if (!token) {
    // token not specified
    reply(Boom.unauthorized())
  } else {
    // lookup single non-revoked API Key
    knex('DeviceApiKey')
      .where({ token, revoked: false })
      .count('id as cnt')
      .then(([keys]) => {
        if (keys.cnt !== 1) {
          reply(Boom.unauthorized())
        } else {
          const scope = ['deviceApi']
          const credentials = { token, scope }
          reply.continue({ credentials })
        }
      })
      .catch(() => Boom.unauthorized())
  }
}

module.exports = {
  register
}
