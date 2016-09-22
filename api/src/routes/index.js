let Joi = require('joi')

// Adds all API routes to the server
function addRoutes(server){
  server.route(require('./auth.js').map(decorateAPI()))
  server.route(require('./device.js').map(decorateAPI('device')))
  server.route(require('./person.js').map(decorateAPI('person')))
  server.route(require('./site.js').map(decorateAPI('site')))
}

// Decorates an API route with common configuration so
// it does not need to specified explicity for every route
function decorateAPI(module){
  return (route) => {
    // add ['api'] tag by default so available in Hapi-Swagger
    let {config} = route
    if(!config){
      config = {}
      route.config = config
    }
    if(!config.tags){
      config.tags = ['api']
    }

    // If route is authenticated, add common configuration
    if(config.auth !== false){
      // Require module scope to all routes
      if(module){
        let {auth} = config
        if(!auth){ // could be undefined instead of explicitly false
          auth = {}
          config.auth = auth
        }
        let {scope} = auth
        if(!scope){
          scope = []
          auth.scope = scope
        }
        auth.scope = [`+${module}`].concat(auth.scope)
      }

      // Add JWT Auth token query param configuration
      let {validate} = config
      if(!validate){
        validate = {}
        config.validate = validate
      }
      let {query} = validate
      if(!query){
        query = {}
        validate.query = query
      }
      let {token} = query
      if(!token){
        query.token = Joi.string().description('JWT Authentication token')
      }
    }

    return route
  }
}

module.exports = {
  addRoutes
}
