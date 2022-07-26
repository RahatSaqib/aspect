const logger = require('./logger')

const hapiLogger = {
  name: 'hapiLogger',
  version: '1.0.0',
  register: async server => {
    server.ext('onRequest', (request, reply) => {
      logger.info(`${request.method.toString().toUpperCase()} ${request.url}`)
      if (request.params) logger.info(request.params, { reLabel: 'aspect:api:request:params' })
      if (request.headers) logger.info(request.headers, { reLabel: 'aspect:api:headers' })
      if (request.payload) logger.info(request.payload, { reLabel: 'aspect:request:payload' })

      return reply.continue
    })
  },
}

exports.plugin = hapiLogger
