const config = require('./config')

let newrelic = null
if (config.newRelic.enabled) {
  newrelic = require('newrelic')
}

function addCustomAttributes(...args) {
  if (config.newRelic.enabled) {
    newrelic.addCustomAttributes(...args)
  }
}
const newrelicCustomConfig = {
  name: 'newrelicCustomConfig',
  version: '1.0.0',
  register: async server => {
    server.ext('onRequest', (request, reply) => {
      const requestSize = Buffer.byteLength(JSON.stringify(request.payload || {})) // Calculate the request size
      addCustomAttributes({ requestSize })
      return reply.continue
    })

    server.ext('onPreResponse', function (request, h) {
      const { response } = request

      // Ensure response is a valid response object
      if (response.isBoom) {
        return h.continue // If it's an error, just continue
      }

      const responseSize = Buffer.byteLength(JSON.stringify(response.source || {})) // Calculate the response size
      addCustomAttributes({ responseSize })

      return h.continue
    })
  },
}

exports.plugin = newrelicCustomConfig
