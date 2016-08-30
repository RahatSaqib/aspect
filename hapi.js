require('dotenv-safe').load()

let Hapi = require('hapi')

// =======================
// configuration =========
// =======================
let { version } = require('./package.json')
let server = new Hapi.Server()
let port = process.env.PORT || 8080
server.connection({port})

server.register([
  // static file handling (hapi-swagger dependency)
  require('inert'),

  // view layer (hapi-swagger dependency)
  require('vision'),

  // SwaggerUI and documentation
  {
    register: require('hapi-swagger'),
    options: {
      info: {
        title: 'Aspect API doc',
        version
      }
    }
  },

	// log responses to console using good
  {
    register: require('good'),
    options: {
      reporters: {
        console: [
          {
            // Only show response log, and request.log events
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{
              log: '*',
              response: '*',
              request: '*'
            }]
          },
          // format as string for console
          { module: 'good-console' },
          // write to std out
          'stdout'
        ]
      }
    }
  }
], err => { if(err) throw err })

// =======================
// routes ================
// =======================

server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => reply('Hello! The API is at /api.')
})
server.route(require('./routes/auth_h.js'))
server.route(require('./routes/device_h.js'))
server.route(require('./routes/person_h.js'))

// =======================
// start the server ======
// =======================
server.start(err => {
  if(err){
    throw err
  }
  console.log('Magic happens at http://localhost:' + port)
})
