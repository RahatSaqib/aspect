const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { version } = require('../../package.json')
const { normalizeToken } = require('./apiKey')
const { lookupUsingCredentials } = require('../deviceApiKey/service')
const { authenticate: tryAnonymousAuthenticate } = require('./deviceApiRawUnauthenticatedPlugin')
const logger = require('../shared/logger')

function register(plugin) {
  plugin.auth.scheme('deviceApiKey', () => ({ authenticate }))
  plugin.ext('onPostAuth', (request, h) => {
    if (typeof request.payload === 'string' && request.mime === 'application/json') {
      request.payload = JSON.parse(request.payload)
    }
    return h.continue
  })
}

function authenticate(request, h) {
  const { query, headers } = request
  let token = ''
  if (query.token) {
    // prefer token in query string
    ;({ token } = query)
  } else if (headers.authorization) {
    // Remove Bearer from Authorization header
    token = headers.authorization.replace(/Bearer/gi, '')
  }
  if (!token) {
    return tryAnonymousAuthenticate(request, h)
  }
  return authToken(token)
    .then(credentials => h.authenticated({ credentials }))
    .catch(err => {
      logger.error(err)
      throw err
    })
}

const validateApiKeyAuthBasic = {
  async validate(request, username, password) {
    if (!username) {
      return authToken(password)
        .then(credentials => ({ isValid: true, credentials }))
        .catch(() => ({ isValid: false }))
    }
    return authUsernameAndPassword(username, password)
      .then((credentials, error) => {
        if (error) {
          return authToken(password)
        }
        return credentials
      })
      .then(credentials => ({ isValid: true, credentials }))
      .catch(() => ({ isValid: false }))
  },
}

async function authUsernameAndPassword(username, password) {
  if (!username || !password) {
    throw Boom.unauthorized('Invalid Credentials')
  }
  const deviceApiKeyAuthResult = await lookupUsingCredentials(username, password)
  const { authenticated, data } = deviceApiKeyAuthResult || {}
  if (!authenticated || !data) {
    if (password) {
      return authToken(password)
    }
    throw Boom.unauthorized('Cannot authorize API Key')
  }
  const { id, token } = data
  const scope = ['deviceApi']
  const name = `(${id}) ${username || ''}`.trim()
  const credentials = { token, scope, name }
  return credentials
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
    .first('k.id as keyId', 'd.name as deviceName', 'k.expiresOn')
  if (!key) {
    throw Boom.unauthorized('Cannot authorize API Key')
  }
  if (!!key.expiresOn && key.expiresOn < new Date()) {
    throw Boom.unauthorized('API Key Token has Expired')
  }

  const scope = ['deviceApi']
  const name = `(${key.keyId}) ${key.deviceName || ''}`.trim()
  const credentials = { token, scope, name }
  return credentials
}

module.exports = {
  plugin: {
    name: 'deviceApiKeyAuth',
    version,
    register,
  },
  validateApiKeyAuthBasic,
}
