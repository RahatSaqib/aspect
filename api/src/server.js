// =======================
// configuration =========
// =======================
const _ = require('lodash')
const config = require('./config')
const { version } = require('./../package.json')
const { addClientRoutes, addDeviceRoutes } = require('./routes')
const Hapi = require('hapi')

const server = new Hapi.Server()
const port = process.env.PORT || 8080
const clientApiPath = '/api'
const deviceApiPath = '/device'

server.connection({
  port,
  routes: {
    cors: true,
  },
})

const plugins = [
  // static file handling (hapi-swagger dependency)
  require('inert'),

  // view layer (hapi-swagger dependency)
  require('vision'),

  // JWT for authentication in client API
  require('hapi-auth-jwt2'),

  // API Key in Device API
  require('./deviceApi/deviceApiKeyPlugin'),

  // SwaggerUI and documentation
  {
    register: require('hapi-swagger'),
    options: {
      info: {
        title: 'Aspect API',
        version,
      },
    },
  },

  // log responses to console using good
  {
    register: require('good'),
    options: {
      reporters: loadGoodReporter(),
    },
  },

  // Set payload prior to validation transformation
  rawPayloadPlugin,
]

addRavenPlugin(plugins)

// load and return the good logging configuration
function loadGoodReporter() {
  const { logstash } = config

  if (logstash) {
    // Forward to logstash if configured
    return {
      logstash: [
        {
          // Only show response log, and request.log events
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{ response: '*' }],
        },
        // send to logstash
        {
          module: 'good-logstash',
          args: [logstash.endpoint],
        },
      ],
    }
  }

  // Logs to console by default.
  return {
    console: [
      {
        // Only show response log, and request.log events
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [{ log: '*', response: '*', request: '*' }],
      },
      // format as string for console
      { module: 'good-console' },
      // write to std out
      'stdout',
    ],
  }
}

// Loads Raven (Sentry) plugin if configured
function addRavenPlugin(plugins) {
  const { raven } = config
  if (raven) {
    plugins.push({
      register: require('hapi-raven'),
      options: { dsn: raven.dsn },
    })
  }
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
  if (err) throw err
})

// ================================================
// Authentication strategy and Authorization Scopes
// ================================================
// use config: { auth: false } on route definition to disable authentication
// Device API uses API Keys
server.auth.strategy('deviceApi', 'deviceApiKey')
// Client API uses JWT
server.auth.strategy('clientApi', 'jwt', {
  key: config.secret,
  validateFunc(decoded, request, callback) {
    // TODO What do we want to do to validate data within decoded JWT token?
    const valid = true

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
    throw err
  }
  console.log(`Magic happens at http://localhost:${port}`) // eslint-disable-line no-console
})
