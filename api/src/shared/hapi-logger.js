const logger = require('./logger')

const hapiLogger = {
  name: 'hapiLogger',
  version: '1.0.0',
  register: async server => {
    server.ext('onRequest', (request, reply) => {
      logger.http(`${request.method.toString().toUpperCase()} ${request.url}`)
      if (request.params)
        logger.http(request.params, { reLabel: 'aspect:api:request:params' })
      if (request.headers)
        logger.http(request.headers, { reLabel: 'aspect:api:headers' })
      if (request.payload)
        logger.http(request.payload, { reLabel: 'aspect:request:payload' })

      return reply.continue
    })
  },
}

exports.plugin = hapiLogger
