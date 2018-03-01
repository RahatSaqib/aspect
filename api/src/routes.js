const Joi = require('joi')

// Adds all API routes to the server
function addClientRoutes(server) {
  server.route(require('./accountDetails/endpoints').map(decorateClientAPI()))
  server.route(require('./auth/endpoints').map(decorateClientAPI()))
  server.route(require('./assay/endpoints').map(decorateClientAPI('assay')))
  server.route(require('./demo/endpoints').map(decorateClientAPI('demo')))
  server.route(require('./device/endpoints').map(decorateClientAPI('device')))
  server.route(
    require('./deviceApiKey/endpoints').map(decorateClientAPI('deviceApiKey'))
  )
  server.route(
    require('./deviceOperation/endpoints').map(decorateClientAPI('device'))
  )
  server.route(
    require('./deviceType/endpoints').map(decorateClientAPI('device'))
  )
  server.route(require('./geography/endpoints').map(decorateClientAPI()))
  server.route(require('./person/endpoints').map(decorateClientAPI('person')))
  server.route(require('./site/endpoints').map(decorateClientAPI('site')))
  server.route(require('./result/endpoints').map(decorateClientAPI('result')))
  server.route(require('./report/endpoints').map(decorateClientAPI('report')))
  server.route(require('./partner/endpoints').map(decorateClientAPI('partner')))
  server.route(require('./job/endpoints').map(decorateClientAPI('person')))
  server.route(
    require('./consumable/endpoints').map(decorateClientAPI('inventory'))
  )
  server.route(
    require('./notification/endpoints').map(decorateClientAPI('notification'))
  )
  server.route(require('./task/endpoints').map(decorateClientAPI('task')))
  server.route(
    require('./inventory/endpoints').map(decorateClientAPI('inventory'))
  )
  server.route(
    require('./dashboard/endpoints').map(decorateClientAPI('dashboard'))
  )
  server.route(require('./tag/endpoints').map(decorateClientAPI()))
}

function addDeviceRoutes(server) {
  server.route(
    require('./deviceApi/endpoints').map(decorateDeviceAPI('device'))
  )
}

// Decorates an API route with common configuration so
// it does not need to specified explicity for every route
function decorateClientAPI(module) {
  // must always be authenticated using Client JWT
  const scope = ['+clientApi']
  const strategies = ['clientApi']

  if (module) {
    // If module specified, must have one of admin or `{module}:admin`
    // in addition to any other listed in scope of routes.
    scope.push('admin', `${module}:admin`)
  }
  return decorateAPI({ scope, strategies })
}

function decorateDeviceAPI() {
  // must always be authenticated using Device JWT
  const scope = ['+deviceApi']
  const strategies = ['deviceApi']
  return decorateAPI({ scope, strategies })
}

function decorateAPI({ scope, strategies }) {
  return route => {
    // add ['api'] tag by default so available in Hapi-Swagger
    let { config } = route
    if (!config) {
      config = {}
      route.config = config
    }
    if (!config.tags) {
      config.tags = ['api']
    }

    // If route is authenticated, add common configuration
    if (config.auth !== false) {
      // Require module scope to all routes
      if (module) {
        let { auth } = config
        if (!auth) {
          // could be undefined instead of explicitly false
          auth = {}
          config.auth = auth
        }
        auth.strategies = strategies.concat(auth.strategies || [])
        auth.scope = scope.concat(auth.scope || [])
      }

      // Add JWT Auth token query param configuration
      let { validate } = config
      if (!validate) {
        validate = {}
        config.validate = validate
      }
      let { query } = validate
      if (!query) {
        query = {}
        validate.query = query
      }
      const { token } = query
      if (!token) {
        query.token = Joi.string().description('JWT Authentication token')
      }
    }

    return route
  }
}

function asyncHandler(handler) {
  return (request, reply) =>
    handler(request)
      .then(reply)
      .then(null, err => {
        console.error(err) // eslint-disable-line no-console
        throw err
      })
}

// extracts and sanitizes the parameters related to sorting and paging
// from the candidate params and returns them as an object
function getSortPageParams(params, sortColumnMapping, defaultSort) {
  return Object.assign(
    {},
    getSortParams(params, sortColumnMapping, defaultSort),
    getPageParams(params)
  )
}

// extracts and sanitizes the parameters related to sorting from the
// candidate params and returns them as an object
function getSortParams(params, sortColumnMapping, defaultSort) {
  const result = {}

  result.sortCol =
    sortColumnMapping && params.sortCol && sortColumnMapping[params.sortCol]
      ? sortColumnMapping[params.sortCol]
      : params.sortCol ? params.sortCol : defaultSort
  result.sortDir = params.sortDir === 'desc' ? 'desc' : 'asc'

  return result
}

// extracts and sanitizes the parameters related to paging from the
// candidate params and returns them as an object
function getPageParams(params) {
  const result = {}

  result.page = parseInt(params.page, 10) || 0
  result.size = parseInt(params.size, 10) || 50
  result.skip = result.page * result.size

  return result
}

function validateSortPageParams(...sortColumns) {
  return {
    sortCol:
      sortColumns.length > 0
        ? Joi.string()
            .valid(sortColumns)
            .description('Sort on named column')
        : Joi.string().description('Sort on named column'),
    sortDir: Joi.string()
      .valid('asc', 'desc')
      .description('Sort order ascending or descending'),
    page: Joi.number()
      .integer()
      .min(0)
      .description('Page index with 0 as first page'),
    size: Joi.number()
      .integer()
      .positive()
      .description('Page size'),
  }
}

function validateDateRangeParams() {
  return {
    minDate: Joi.date()
      .iso()
      .allow(null)
      .description('From Date'),
    maxDate: Joi.date()
      .iso()
      .allow(null)
      .description('To Date'),
  }
}

module.exports = {
  addClientRoutes,
  addDeviceRoutes,
  asyncHandler,
  getSortParams,
  getPageParams,
  getSortPageParams,
  validateSortPageParams,
  validateDateRangeParams,
}
