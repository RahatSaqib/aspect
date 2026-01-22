const Boom = require('@hapi/boom')
const { findRawDataProcessor } = require('./dataProcessors/registration')
const { version } = require('../../package.json')
const { authenticate: deviceApiKeyAuthenticate } = require('../deviceApi/deviceApiKeyPlugin')

function register(plugin) {
  plugin.auth.scheme('deviceApiRawAuth', () => ({ authenticate }))
  plugin.ext('onPostAuth', (request, h) => {
    if (typeof request.payload === 'string' && request.mime === 'application/json') {
      request.payload = JSON.parse(request.payload)
    }
    return h.continue
  })
}

async function authenticate(request, h) {
  const { headers } = request

  // If an Authorization header is present, try to authenticate using the deviceApiKeyPlugin logic
  if (headers.authorization) {
    return deviceApiKeyAuthenticate(request, h)
  }

  const DataProcessorClass = await findRawDataProcessor(request)
  if (DataProcessorClass && DataProcessorClass.AllowUnauthenticatedRequests) {
    return h.authenticated({ credentials: { scope: ['deviceApi'] } })
  }

  return h.unauthenticated(Boom.unauthorized('No Handler Found for This Anonymous Request'))
}

module.exports = {
  plugin: {
    name: 'deviceApiRawAuth',
    version,
    register,
  },
}
