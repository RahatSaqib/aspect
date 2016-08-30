let Hapi = require('hapi')
let pack = require('./package.json')
let Vision = require('vision')
let Inert = require('inert')
let HapiSwagger = require('hapi-swagger')

let server = new Hapi.Server()
server.connection({port: 8081})

server.route(require('./routes/auth_h.js'))
server.route(require('./routes/device_h.js'))
server.route(require('./routes/person_h.js'))

server.register([
  Inert,
  Vision,
  {
    register: HapiSwagger,
    options: {
      info: {
        title: 'Aspect API doc',
        version: pack.version
      }
    }
  }
], handleError)

server.start(handleError)

function handleError(err){
  if(err){
    throw err
  }
}
