// =======================
// configuration =========
// =======================
let config = require('./config')
let { version } = require('./../package.json')
let { addRoutes } = require('./routes/index')

let Hapi = require('hapi')
let server = new Hapi.Server()
let port = process.env.PORT || 8080
let apiPath = '/api'
server.connection({
  port,
  routes: {
    cors: true
  }
})

let plugins = [
  // static file handling (hapi-swagger dependency)
  require('inert'),

  // view layer (hapi-swagger dependency)
  require('vision'),

  // JWT for authentication
  require('hapi-auth-jwt2'),

  // SwaggerUI and documentation
  {
    register: require('hapi-swagger'),
    options: {
      basePath: apiPath,
      info: {
        title: 'Aspect API',
        version
      }
    }
  },

	// log responses to console using good
  {
    register: require('good'),
    options: {
      reporters: loadGoodReporter()
    }
  }
]
addRavenPlugin(plugins)

// load and return the good logging configuration
function loadGoodReporter(){
  let {logstash} = config

  if(logstash){
    // Forward to logstash if configured
    return {
      logstash: [
        {
          // Only show response log, and request.log events
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{ response: '*' }]
        },
        // send to logstash
        {
          module: 'good-logstash',
          args: [ logstash.endpoint ]
        }
      ]
    }
  } else {
    // Logs to console by default.
    return {
      console: [
        {
          // Only show response log, and request.log events
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{ log: '*', response: '*', request: '*' }]
        },
        // format as string for console
        { module: 'good-console' },
        // write to std out
        'stdout'
      ]
    }
  }
}

// Loads Raven (Sentry) plugin if configured
function addRavenPlugin(plugins){
  let {raven} = config
  if(raven){
    plugins.push({
      register: require('hapi-raven'),
      options: {dsn: raven.dsn}
    })
  }
}

server.register(plugins, err => { if(err) throw err })

// ================================================
// Authentication strategy and Authorization Scopes
// ================================================
server.auth.strategy('jwt', 'jwt', {
  key: config.secret,
  validateFunc: function(decoded, request, callback){
    // TODO What do we want to do to validate data within decoded JWT token?
    let valid = true

    // can specify either module or permission, e.g. "device" or "device:view"
    // for authorization scope on routes.
    // multiple scopes can be specified:
    // ["device:view"] will authorize anyone with device module and view activity
    // ["device", "site"] will authorize anyone with device or site modules
    // ["device", "!site"] will authorize anyone with device but not site modules
    // ["+device", "site:view", "site:edit"] will authorize anyone with device (required)
    //   and either "site:view" or "site:edit" permissions
    let scope = [].concat(decoded.modules, decoded.permissions)

    callback(null, valid, Object.assign({scope}, decoded))
  }
  //TODO JWT verfication algorithm verifyOptions: { algorithms: [ 'HS256' ] }
})

// all routes use JWT authentication by default
// use config: { auth: false } on route definition to disable authentication
server.auth.default('jwt')

// =======================
// routes ================
// =======================

server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => reply('Hello! The API is at /api.'),
  config: {
    auth: false
  }
})

// use plugin to mount all API routes at /api
function apiPlugin(server, options, next){
  addRoutes(server)
  next()
}
apiPlugin.attributes = {
  name: 'api',
  version
}
server.register({register: apiPlugin}, {
  routes: {
    prefix: apiPath
  }
}, err => { if(err) throw err })

// =======================
// start the server ======
// =======================
server.start(err => {
  if(err){
    throw err
  }
  console.log('Magic happens at http://localhost:' + port)
})
