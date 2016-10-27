let Promise = require('bluebird')
let Boom = require('boom')
let Joi = require('joi')

// Adds all API routes to the server
function addClientRoutes(server){
  server.route(require('./accountDetails/endpoints').map(decorateClientAPI()))
  server.route(require('./auth/endpoints').map(decorateClientAPI()))
  server.route(require('./assay/endpoints').map(decorateClientAPI('assay')))
  server.route(require('./device/endpoints').map(decorateClientAPI('device')))
  server.route(require('./geography/endpoints').map(decorateClientAPI()))
  server.route(require('./person/endpoints').map(decorateClientAPI('person')))
  server.route(require('./site/endpoints').map(decorateClientAPI('site')))
  server.route(require('./result/endpoints').map(decorateClientAPI('result')))
  server.route(require('./partner/endpoints').map(decorateClientAPI('partner')))
}

function addDeviceRoutes(server){
  server.route(require('./deviceApi/endpoints').map(decorateDeviceAPI('device')))
}

// Decorates an API route with common configuration so
// it does not need to specified explicity for every route
function decorateClientAPI(module){
  // must always be authenticated using Client JWT
  const scope = ['+clientApi']

  if(module){
    // If module specified, must have one of admin or `{module}:admin`
    // in addition to any other listed in scope of routes.
    scope.push('admin', `${module}:admin`)
  }
  return decorateAPI({scope})
}

function decorateDeviceAPI(){
  // must always be authenticated using Device JWT
  const scope = ['+deviceApi']
  return decorateAPI({scope})
}

function decorateAPI({scope}){
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
        auth.scope = scope.concat(auth.scope || [])
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


/**
 * Creates a coroutine based handler using the provided
 * handler generator that can be used in the style of
 * a Bluebird coroutine accepting the Hapi request and
 * returning a value to render as the reply.
 *
 * Any unhandled error will result in a 500 error. Return
 * a Boom error for custom error reporting
 */
function asyncHandler(handler){
  return Promise.coroutine(function*(request, reply){
    try {
      let result = yield* handler(request)
      reply(result)
    } catch(err) {
      console.error(err)
      reply(Boom.wrap(err, 500))
      // Need to rethrow error for detection of plugins
      throw err
    }
  })
}


// extracts and sanitizes the parameters related to sorting and paging
// from the candidate params and returns them as an object
function getSortPageParams(params, defaultSort){
  let result = {}

  result.sortCol = params.sortCol ? params.sortCol : defaultSort
  result.sortDir = params.sortDir == 'desc' ? 'desc' : 'asc'
  result.page = parseInt(params.page) || 0
  result.size = parseInt(params.size) || 20
  result.skip = result.page * result.size

  return result
}

function validateSortPageParams(...sortColumns){
  return {
    sortCol: Joi.string().valid(sortColumns).description('Sort on named column'),
    sortDir: Joi.string().valid('asc', 'desc').description('Sort order ascending or descending'),
    page: Joi.number().integer().min(0).description('Page index with 0 as first page'),
    size: Joi.number().integer().positive().description('Page size')
  }
}

module.exports = {
  addClientRoutes,
  addDeviceRoutes,
  asyncHandler,
  getSortPageParams,
  validateSortPageParams
}
