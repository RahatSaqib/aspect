let Hapi = require('hapi')
let pack = require('./package.json')
let Vision = require('vision')
let Inert = require('inert')
let HapiSwagger = require('hapi-swagger')

let server = new Hapi.Server()
server.connection({port: 8081})

let authRoutes = require('./routes/auth_h.js')
for(let route of authRoutes){
  server.route(route)
}

let deviceRoutes = require('./routes/device_h.js')
for(let route of deviceRoutes){
  server.route(route)
}

let personRoutes = require('./routes/person_h.js')
for(let route of personRoutes){
  server.route(route)
}

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
], (err) => {if(err) throw err})

server.start(err => {
  if(err){
    throw err
  }
})
