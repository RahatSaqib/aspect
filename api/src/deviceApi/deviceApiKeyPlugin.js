const Boom = require('boom')
const { knex } = require('../db')
const { version } = require('../../package.json')
const { normalizeToken } = require('./apiKey')

function register(plugin, options, next) {
  plugin.auth.scheme('deviceApiKey', () => ({ authenticate }))
  next()
}

register.attributes = {
  name: 'deviceApiKeyAuth',
  version,
}

function authenticate(request, reply) {
  const { query, headers } = request
  let token = ''
  if (query.token) {
    // prefer token in query string
    ;({ token } = query)
  } else if (headers.authorization) {
    // Remove Bearer from Authorization header
    token = headers.authorization.replace(/Bearer/gi, '')
  }
  authToken(token)
    .then(credentials => reply.continue({ credentials }))
    .catch(err => reply(err))
}

function validateApiKeyAuthBasic(request, username, password, callback) {
  authToken(password)
    .then(credentials => callback(null, true, credentials))
    .catch(err => callback(err, false, null))
}

async function authToken(token) {
  // Remove whitespace and dashes
  token = normalizeToken(token)

  if (!token) {
    // token not specified
    throw Boom.unauthorized('Invalid API Key')
  }

  // lookup single non-revoked API Key
  const [keys] = await knex('DeviceApiKey')
    .where({ token, revoked: false })
    .count('id as cnt')

  if (keys.cnt !== 1) {
    throw Boom.unauthorized('Cannot authorize API Key')
  }

  const scope = ['deviceApi']
  const credentials = { token, scope }
  return credentials
}

module.exports = {
  register,
  validateApiKeyAuthBasic,
}
