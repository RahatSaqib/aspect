// =======================
// configuration =========
// =======================
const _ = require('lodash')
const config = require('./config')
const { version } = require('./../package.json')
const { addClientRoutes, addDeviceRoutes } = require('./routes')
const { createMessageQueue } = require('./mq')
const { addSubscriptions } = require('./subscriptions')
const { startScheduler } = require('./scheduler')
const { addLoggers } = require('./logger/service')
const deviceApiKeyPlugin = require('./deviceApi/deviceApiKeyPlugin')
const Hapi = require('hapi')

const server = new Hapi.Server()
const port = process.env.PORT || 8080
const clientApiPath = '/api'
const deviceApiPath = '/device'

server.connection({
  port,
  routes: {
    cors: {
      exposedHeaders: ['WWW-Authenticate', 'Server-Authorization', 'Date'],
    },
  },
})

const { swagger: { enabled: swaggerEnabled }, raven } = config

const plugins = [
  require('inert'),
  // Load Swagger documentation if configured
  ...(swaggerEnabled
    ? [
        require('vision'),
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
    : []),
  // Load Raven (Sentry) plugin if configured
  ...(raven
    ? [
        {
          register: require('hapi-raven'),
          options: { dsn: raven.dsn },
        },
      ]
    : []),
  // JWT for authentication in client API
  require('hapi-auth-jwt2'),

  // API Key in Device API
  deviceApiKeyPlugin,

  // Basic authentication in Device API
  require('hapi-auth-basic'),

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
      server.ext('onPreHandler', (request, reply) => {
        request.plugins.messageContext = queue.createMessageContext(
          'aspect_request'
        )
        reply.continue()
      })
      next()
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
