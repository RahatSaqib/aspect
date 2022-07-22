const Boom = require('@hapi/boom')
const { findRawDataProcessor } = require('../deviceApiRaw/dataProcessors/registration')
const { version } = require('../../package.json')

function register(plugin) {
  plugin.auth.scheme('deviceApiRawUnauthenticated', () => ({ authenticate }))
  plugin.ext('onPostAuth', (request, h) => {
    if (typeof request.payload === 'string' && request.mime === 'application/json') {
      request.payload = JSON.parse(request.payload)
    }
    return h.continue
  })
}

async function authenticate(request, h) {
  const DataProcessorClass = await findRawDataProcessor(request)
  if (DataProcessorClass && DataProcessorClass.AllowUnauthenticatedRequests) {
    return h.authenticated({ credentials: { scope: ['deviceApi'] } })
  }
  return h.unauthenticated(Boom.unauthorized('No Handler Found for This Anonymous Request'))
}

module.exports = {
  plugin: {
    name: 'deviceApiRawUnauthenticated',
    version,
    register,
  },
  authenticate,
}
