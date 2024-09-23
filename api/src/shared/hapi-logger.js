const logger = require('./logger')

const hapiLogger = {
  name: 'hapiLogger',
  version: '1.0.0',
  register: async server => {
    server.ext('onRequest', (request, reply) => {
      logger.info(`${request.method.toString().toUpperCase()} ${request.url}`)
      if (request.params) logger.info(request.params, { reLabel: 'aspect:api:request:params' })
      if (request.headers) logger.info(request.headers, { reLabel: 'aspect:api:headers' })

      return reply.continue
    })

    server.ext('onPreResponse', function (request, h) {
      const { response } = request

      if (request.payload) logger.info(request.payload, { reLabel: 'aspect:api:request:payload' })

      if ((request.method.toLowerCase() === 'put' || request.method.toLowerCase() === 'post') && response.source) {
        logger.info(response.source, { reLabel: 'aspect:api:response:payload' })
      }
      return h.continue
    })
  },
}

exports.plugin = hapiLogger
