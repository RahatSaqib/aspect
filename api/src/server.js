// eslint-disable-next-line import/order
require('../newrelic')
// eslint-disable-next-line import/order
const { Sentry, initSentry } = require('./shared/sentry')
// Initialize Sentry before creating the server
initSentry()

const fs = require('fs')
const _ = require('lodash')
const Hapi = require('@hapi/hapi')
const Joi = require('@hapi/joi')
const Boom = require('@hapi/boom')

const config = require('./config')
const { knex, getCurrentSslCipher } = require('./db')

// =======================
// configuration =========
// =======================
const { version } = require('../package.json')
const { addClientRoutes, addDeviceRoutes, addDeviceRawRoutes, addMobileRoutes } = require('./routes')
const { createMessageQueue } = require('./mq')
const { addSubscriptions } = require('./subscriptions')
const { startScheduler } = require('./scheduler/scheduler')
const { addLoggers } = require('./logger/service')
const logger = require('./shared/logger')
const { plugin: deviceApiKeyPlugin } = require('./deviceApi/deviceApiKeyPlugin')
const { plugin: deviceApiRawAuthPlugin } = require('./deviceApiRaw/deviceApiRawAuthPlugin')
const { initDictionaryTables } = require('./shared/dictionary')

const { port } = config

const AspectCacheSingleton = require('../aspectCache')
const { registerMessageQueue } = require('./messageQueue')
const { asyncPayloadProcessorStartUp } = require('./deviceApi/asyncPayloadProcessor')

// version is cached to indicate the new version only when Aspect api restarts,
// instead of doing so directly when package.json is updated.
const cache = AspectCacheSingleton.getInstance()
cache.setVersion(version)

const server = new Hapi.server({
  port,
  host: '127.0.0.1',
  routes: {
    cors: {
      exposedHeaders: [
        'WWW-Authenticate',
        'Server-Authorization',
        'Date',
        'Content-Disposition', // for report files, see 'downloadReport()' in '/report/serviceReports.js'
      ],
    },
    validate: {
      failAction: async (request, h, err) => {
        // log and respond with the full error
        logger.error(err)
        throw err
      },
    },
    response: {
      failAction: async (request, h, err) => {
        // Log the validation error
        logger.error('Response validation failed:', err.details)

        // Format the validation error using Boom
        const error = Boom.badData('Response validation failed', err.details || err.message)
        error.output.payload.validation = {
          source: err.details?.[0]?.path?.join('.') || 'unknown',
          keys: err.details?.map(detail => detail.path.join('.')) || [],
        }
        error.output.payload.message = 'Response validation failed'
        throw error
      },
    },
  },
})
server.validator(Joi)

const {
  swagger: { enabled: swaggerEnabled },
} = config

// Load Swagger documentation if configured
const swaggerPlugins = swaggerEnabled
  ? [
      require('@hapi/inert'), // eslint-disable-line import/order
      require('@hapi/vision'), // eslint-disable-line import/order
      {
        plugin: require('hapi-swagger'),
        options: {
          info: {
            title: 'Aspect API',
            version,
          },
          schemes: config.swagger.schemes,
          host: config.swagger.host,
          pathPrefixSize: config.swagger.pathPrefixSize,
          swaggerUIPath: `${config.swagger.apiUrlSegment}/swaggerui/`,
          jsonPath: `${config.swagger.apiUrlSegment}/swagger.json`,
          pathReplacements: [
            {
              replaceIn: 'all',
              pattern: /^/,
              replacement: config.swagger.apiUrlSegment,
            },
          ],
        },
      },
    ]
  : []

// Plugin to set payload prior to validation transformation
const rawPayloadPlugin = {
  name: 'rawPayload',
  version,
  register: async server => {
    server.ext('onPostAuth', (request, h) => {
      request.plugins.rawPayload = request.payload
      if (request.payload) Sentry.setContext('payload', request.payload)
      return h.continue
    })
  },
}

const queueName = config.amqp.name

const messageQueuePlugin = {
  name: 'messageQueue',
  version,
  register: async server => {
    try {
      const queue = await createMessageQueue(queueName)

      server.ext('onPreHandler', (request, h) => {
        request.plugins.messageContext = queue.createMessageContext('aspect_request')
        return h.continue
      })

      addLoggers(server, queue)
      await addSubscriptions(queue)

      if (config.enableAsyncPayloadProcessing) {
        await asyncPayloadProcessorStartUp(queue, queue.createMessageContext('aspect_request'))
      }

      if (config.scheduler.enabled) {
        const dispatcher = startScheduler(queue)
        server.app.dispatcher = dispatcher
      }
    } catch (err) {
      logger.error(err)
    }
  },
}

/**
 * TODO: Once the rabbit mq is removed make this plugin name generic
 */
// eslint-disable-next-line no-unused-vars
const bullMessageQueuePlugin = {
  name: 'bullMessageQueue',
  version,
  register: registerMessageQueue,
}

const plugins = [
  require('./newrelicCustomConfig'),
  // logging framework
  require('./shared/hapi-logger'),
  require('@hapi/inert'), // eslint-disable-line import/order
  ...swaggerPlugins,
  // JWT for authentication in client API
  require('hapi-auth-jwt2'), // eslint-disable-line import/order

  // API Key in Device API
  deviceApiKeyPlugin,

  // Basic authentication in Device API
  require('@hapi/basic'), // eslint-disable-line import/order

  // API Key or Unauthenticated access to public Device API Raw Endpoints
  deviceApiRawAuthPlugin,

  // Set payload prior to validation transformation
  rawPayloadPlugin,

  // Set message queue
  messageQueuePlugin,
  // bullMessageQueuePlugin,
]

const start = async () => {
  await server.register(plugins)
  await server.register({
    plugin: require('./plugin/apiVersioning'),
    options: {
      defaultVersion: 1,
      mobileApiPath: '/mobile/api/',
    },
  })
  if (config.sentry?.dsn && !config.isDevelopment) {
    logger.info('Sentry is enabled')
    Sentry.hapiIntegration({ server })
  }
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    // ==========================================================================
    // ==========================================================================
    // show raw error in log
    // ==========================================================================
    // ==========================================================================
    server.events.on('log', (event, tags) => {
      if (tags.error) {
        const { error } = event
        logger.error(`-------------------\n${error || event}\n-------------------`)
      }
    })

    server.ext('onPreResponse', function (request, h) {
      const { response } = request
      if (response && response.isBoom) {
        response.output.payload = { ...response.output.payload, ...response.data }
      }
      return h.continue
    })
  }

  /**
   * Make sure to read and cache some dictionaries
   * to be able to get them in sync mode by `getDictionarySync`.
   * As an example - this is needed to use some dictionaries in plugins
   * which are called from plain function within `addConstraints()`.
   * For more details see calling of plugin `modifyQueryToExcludeResult` (2023-04-13 Now deleted)
   * in `api/src/auth/constraints.js`
   */
  server.ext('onRequest', async function (request, h) {
    await initDictionaryTables()
    return h.continue
  })

  // ==========================================================================
  // ==========================================================================
  // Authentication strategies and Authorization Scopes
  // ==========================================================================
  // ==========================================================================
  // use config: { auth: false } on route definition to disable authentication
  // Device API uses API Keys
  server.auth.strategy('deviceApiKey', 'deviceApiKey')
  server.auth.strategy('deviceApiRawAuth', 'deviceApiRawAuth')

  // Common function to validate scope based on the request
  const validateApi = scopeApi => {
    const validateFnc = async function (decoded, request) {
      let isValid = true
      let errorMessage = null
      // if user has to accept license, deny all requests except to the license api:
      if (decoded.hasToAcceptLicenseId && request.url.pathname.indexOf('/api/auth/license') === -1) {
        errorMessage = "The user you're trying to login didn't accept the license"
        isValid = false
      }
      // can specify either module or permission, e.g. "device" or "device:view"
      // for authorization scope on routes.
      // multiple scopes can be specified:
      // ["device:view"] will authorize anyone with device module and view activity
      // ["device", "site"] will authorize anyone with device or site modules
      // ["device", "!site"] will authorize anyone with device but not site modules
      // ["+device", "site:view", "site:edit"] will authorize anyone with device (required)
      //   and either "site:view" or "site:edit" permissions
      const modules = decoded.permissions
        ? _.uniq(
            _.map(
              _.filter(decoded.permissions, permission => permission.indexOf(':') > 0),
              permission => permission.substr(0, permission.indexOf(':'))
            )
          )
        : []
      const scope = [scopeApi].concat(modules, decoded.permissions || [])
      return { isValid, errorMessage, credentials: { scope, ...decoded } }
    }
    return validateFnc
  }

  // Client API uses JWT
  server.auth.strategy('clientApi', 'jwt', {
    key: config.secret,
    validate: validateApi('clientApi'),
    // TODO JWT verification algorithm verifyOptions: { algorithms: [ 'HS256' ] }
  })

  // Mobile API uses JWT
  server.auth.strategy('mobileApi', 'jwt', {
    key: config.secret,
    validate: validateApi('mobileApi'),
    // TODO JWT verification algorithm verifyOptions: { algorithms: [ 'HS256' ] }
  })

  // ==========================================================================
  // ==========================================================================
  // routes
  // ==========================================================================
  // ==========================================================================

  // =======================
  // echo to see API is alive
  // =======================
  server.route({
    method: 'GET',
    path: '/',
    handler: () => ({
      message: 'Hello! The API is at /api.',
      version,
    }),
    config: {
      auth: false,
    },
  })

  // =======================
  // use plugin to mount all API routes at /api
  // =======================
  await server.register(
    {
      name: 'clientApi',
      version,
      register: async server =>
        new Promise(resolve => {
          addClientRoutes(server)
          resolve()
        }).catch(err => {
          logger.error(err)
          throw err
        }),
    },
    {
      routes: {
        prefix: '/api',
      },
    }
  )
  // =======================
  // All device API routes mounted under /device
  // =======================
  await server.register(
    {
      name: 'deviceApi',
      version,
      register: async server =>
        new Promise(resolve => {
          addDeviceRoutes(server)
          resolve()
        }).catch(err => {
          logger.error(err)
          throw err
        }),
    },
    {
      routes: {
        prefix: '/device',
      },
    }
  )
  // =======================
  // Device API raw data route mounted under /device/raw
  // =======================
  await server.register(
    {
      name: 'deviceApiRaw',
      version,
      register: async server =>
        new Promise(resolve => {
          addDeviceRawRoutes(server)
          // TODO ZIMBABWE: Try create a test that would have blocked the queue if purgeOnStart hadn't been set
          // TODO ZIMBABWE: Test if files can be uploaded to RAW device API

          // TODO Raw Device API: Delete topics on the message queue that were completely processed when server starts
          // TODO Raw Device API: Archive records from the DeviceApiRaw table once they have been processed
          resolve()
        }).catch(err => {
          logger.error(err)
          throw err
        }),
    },
    {
      routes: {
        prefix: '/device/raw',
      },
    }
  )

  // =======================
  // Mobile API data route mounted under /mobile/api
  // =======================
  await server.register(
    {
      name: 'mobileApi',
      version,
      register: async server =>
        new Promise(resolve => {
          addMobileRoutes(server)
          resolve()
        }).catch(err => {
          logger.error(err)
          throw err
        }),
    },
    {
      routes: {
        prefix: '/mobile/api',
      },
    }
  )

  const useUnixSocket = _.isString(port) && port.includes('/')
  const address = useUnixSocket ? port : `http://localhost:${port}`

  // Delete previous socket
  if (useUnixSocket) {
    try {
      await fs.promises.unlink(address)
    } catch (err) {
      // If file doesn't exist then ignore error
      if (err.code !== 'ENOENT') {
        logger.error(err)
      }
    }
  }

  // Start the server
  try {
    await server.start()
    logger.info(`Server running on ${address}`)

    // Verify MySQL SSL connection
    const sslCipher = await getCurrentSslCipher(knex)
    if (sslCipher) {
      logger.info(`✅ MySQL connection secured with SSL cipher: ${sslCipher}`)
    } else {
      logger.warning('❌ MySQL connection is not using SSL')
    }
  } catch (err) {
    logger.error(err)
    Sentry.captureException(err)
  }
}

start()
