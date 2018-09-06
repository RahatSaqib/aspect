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
  const key = await knex('DeviceApiKey as k')
    .leftJoin('Device as d', 'd.id', 'k.deviceId')
    .where({ 'k.token': token, 'k.revoked': false })
    .first('k.id as keyId', 'd.name as deviceName')

  if (key == null) {
    throw Boom.unauthorized('Cannot authorize API Key')
  }

  const scope = ['deviceApi']
  const name = `(${key.keyId}) ${key.deviceName || ''}`.trim()
  const credentials = { token, scope, name }
  return credentials
}

module.exports = {
  register,
  validateApiKeyAuthBasic,
}
