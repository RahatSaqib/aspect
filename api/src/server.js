// =======================
// configuration =========
// =======================
const _ = require('lodash')
const Hapi = require('hapi')

const config = require('./config')
const { version } = require('./../package.json')
const {
  addClientRoutes,
  addDeviceRoutes,
  addDeviceRawRoutes,
} = require('./routes')
const { createMessageQueue } = require('./mq')
const { addSubscriptions } = require('./subscriptions')
const { startScheduler } = require('./scheduler')
const { addLoggers } = require('./logger/service')
const deviceApiKeyPlugin = require('./deviceApi/deviceApiKeyPlugin')
const { continueUnprocessedRawData } = require('./deviceApiRaw/service')

const server = new Hapi.Server()
const port = process.env.PORT || 8080
const clientApiPath = '/api'
const deviceApiPath = '/device'
const deviceApiRawPath = '/device/raw'

server.connection({
  port,
  routes: {
    cors: {
      exposedHeaders: ['WWW-Authenticate', 'Server-Authorization', 'Date'],
    },
  },
})

const {
  swagger: { enabled: swaggerEnabled },
  raven,
} = config

// Load Raven (Sentry) plugin if configured
const ravenPlugins = raven
  ? [
      {
        register: require('hapi-raven'),
        options: { dsn: raven.dsn },
      },
    ]
  : []

// Load Swagger documentation if configured
const swaggerPlugins = swaggerEnabled
  ? [
      require('vision'), // eslint-disable-line import/order
      {
        register: require('hapi-swagger'),
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

const plugins = [
  ...ravenPlugins,
  require('inert'), // eslint-disable-line import/order
  ...swaggerPlugins,
  // JWT for authentication in client API
  require('hapi-auth-jwt2'), // eslint-disable-line import/order

  // API Key in Device API
  deviceApiKeyPlugin,

  // Basic authentication in Device API
  require('hapi-auth-basic'), // eslint-disable-line import/order

  // Set payload prior to validation transformation
  rawPayloadPlugin,

  // Set message queue
  messageQueuePlugin,
]

function messageQueuePlugin(server, options, next) {
  createMessageQueue('aspect')
    .then(queue => {
      addLoggers(server, queue)
      addSubscriptions(queue)
      if (config.scheduler.enabled) {
        startScheduler(queue)
      }
      return continueUnprocessedRawData(queue)
        .then(() => {
          server.ext('onPreHandler', (request, reply) => {
            request.plugins.messageContext = queue.createMessageContext(
              'aspect_request'
            )
            reply.continue()
          })
          next()
        })
        .catch(next)
    })
    .catch(next)
}
messageQueuePlugin.attributes = {
  name: 'messageQueue',
  version,
}

// Plugin to set payload prior to validation transformation
function rawPayloadPlugin(server, options, next) {
  server.ext('onPostAuth', (request, reply) => {
    request.plugins.rawPayload = request.payload
    reply.continue()
  })
  next()
}

rawPayloadPlugin.attributes = {
  name: 'rawPayload',
  version,
}

server.register(plugins, err => {
  if (err) {
    throw err
  }
})

// ================================================
// Authentication strategy and Authorization Scopes
// ================================================
// use config: { auth: false } on route definition to disable authentication
// Device API uses API Keys
server.auth.strategy('deviceApiKey', 'deviceApiKey')
server.auth.strategy('deviceApiBasic', 'basic', {
  allowEmptyUsername: true,
  validateFunc: deviceApiKeyPlugin.validateApiKeyAuthBasic,
})

// Client API uses JWT
server.auth.strategy('clientApi', 'jwt', {
  key: config.secret,
  validateFunc(decoded, request, callback) {
    let valid = true

    // if user has to accept license, deny all requests except to the license api:
    if (
      decoded.hasToAcceptLicenseId &&
      request.url.path.indexOf('/api/auth/features') === -1 &&
      request.url.path.indexOf('/api/auth/license') === -1
    ) {
      valid = false
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
            _.filter(
              decoded.permissions,
              permission => permission.indexOf(':') > 0
            ),
            permission => permission.substr(0, permission.indexOf(':'))
          )
        )
      : []
    const scope = ['clientApi'].concat(modules, decoded.permissions || [])
    callback(null, valid, Object.assign({ scope }, decoded))
  },
  // TODO JWT verfication algorithm verifyOptions: { algorithms: [ 'HS256' ] }
})

// =======================
// routes ================
// =======================

server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => reply('Hello! The API is at /api.'),
  config: {
    auth: false,
  },
})

// use plugin to mount all API routes at /api
function clientApiPlugin(server, options, next) {
  addClientRoutes(server)
  next()
}
clientApiPlugin.attributes = {
  name: 'clientApi',
  version,
}
server.register(
  { register: clientApiPlugin },
  {
    routes: {
      prefix: clientApiPath,
    },
  },
  err => {
    if (err) throw err
  }
)

// All device API routes mounted under /device
function deviceApiPlugin(server, options, next) {
  addDeviceRoutes(server)
  next()
}
deviceApiPlugin.attributes = {
  name: 'deviceApi',
  version,
}
server.register(
  { register: deviceApiPlugin },
  {
    routes: {
      prefix: deviceApiPath,
    },
  },
  err => {
    if (err) throw err
  }
)

// Device API raw data route mounted under /device/raw
function deviceApiRawPlugin(server, options, next) {
  addDeviceRawRoutes(server)
  // TODO ZIMBABWE: Try create a test that would have blocked the queue if purgeOnStart hadn't been set
  // TODO ZIMBABWE: Test if files can be uploaded to RAW device API

  // TODO Raw Device API: Wait for a data processor topic to be created on the message queue before dispatching messages to it.
  // TODO Raw Device API: Delete topics on the message queue that were completely processed when server starts
  // TODO Raw Device API: Archive records from the DeviceApiRaw table once they have been processed
  next()
}
deviceApiRawPlugin.attributes = {
  name: 'deviceApiRaw',
  version,
}
server.register(
  { register: deviceApiRawPlugin },
  {
    routes: {
      prefix: deviceApiRawPath,
    },
  },
  err => {
    if (err) throw err
  }
)

// =======================
// start the server ======
// =======================
server.start(err => {
  if (err) {
    console.error(err) // eslint-disable-line no-console
    throw err
  }
  console.log(`Magic happens at http://localhost:${port}`) // eslint-disable-line no-console
})
