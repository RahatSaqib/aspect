let Joi = require('joi')

// Adds all API routes to the server
function addRoutes(server){
  server.route(require('./auth_h.js').map(decorateAPI))
  server.route(require('./device_h.js').map(decorateAPI))
  server.route(require('./person_h.js').map(decorateAPI))
}

// Decorates an API route with common configuration so
// it does not need to specified explicity for every route
function decorateAPI(route){
  // add ['api'] tag by default so available in Hapi-Swagger
  let {config} = route
  if(!config){
    config = {}
    route.config = config
  }
  if(!config.tags){
    config.tags = ['api']
  }

  // add JWT Auth token query param if route is authenticated
  // and token configuration not provided
  if(config.auth !== false){
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

module.exports = {
  addRoutes
}
