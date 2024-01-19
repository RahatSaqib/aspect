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
    .then(credentials => {
      return credentials
        ? h.authenticated({ credentials })
        : h.unauthenticated(Boom.unauthorized('Invalid Credentials'))
    })
    .catch(err => {
      logger.warning(err)
      throw err
    })
}

const validateApiKeyAuthBasic = {
  async validate(request, username, password) {
    if (!username) {
      return authToken(password)
        .then(credentials => ({ isValid: !!credentials, credentials }))
        .catch(() => ({ isValid: false }))
    }
    return authUsernameAndPassword(username, password)
      .then((credentials, error) => {
        if (error) {
          return authToken(password)
        }
        return credentials
      })
      .then(credentials => ({ isValid: !!credentials, credentials }))
      .catch(() => ({ isValid: false }))
  },
}

async function authUsernameAndPassword(username, password) {
  if (!username || !password) {
    logger.warning('Invalid Credentials')
    return
  }
  const deviceApiKeyAuthResult = await lookupUsingCredentials(username, password)
  const { authenticated, data } = deviceApiKeyAuthResult || {}
  if (!authenticated || !data) {
    if (password) {
      return authToken(password)
    }
    logger.warning('Cannot authorize API Key')
    return
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
    logger.warning('Blank API Key')
    return
  }

  // lookup single non-revoked API Key
  const key = await knex('DeviceApiKey as k')
    .leftJoin('Device as d', 'd.id', 'k.deviceId')
    .where({ 'k.token': token, 'k.revoked': false })
    .first('k.id as keyId', 'd.name as deviceName', 'k.expiresOn')
  if (!key) {
    logger.warning(`Cannot find API Key Token ${token}`)
    return
  }
  if (!!key.expiresOn && key.expiresOn < new Date()) {
    logger.warning(`API Key Token ${token} has Expired`)
    return
  }

  const scope = ['deviceApi']
  const name = `(${key.keyId}) ${key.deviceName || ''}`.trim()
  const credentials = { token, scope, name, keyId: key.keyId }
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
