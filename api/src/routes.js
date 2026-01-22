const Joi = require('@hapi/joi')
const uniq = require('lodash/uniq')
const logger = require('./shared/logger')
const { REGEX_ISODATESTRING } = require('./shared/date')
const { splitCsvWithTrim } = require('./shared/string')
const { Sentry } = require('./shared/sentry')
// Adds all API routes to the server
function addClientRoutes(server) {
  server.route(require('./accountDetails/endpoints').routes.map(decorateClientAPI()))
  server.route(require('./auth/endpoints').routes.map(decorateClientAPI()))
  server.route(require('./assay/endpoints').routes.map(decorateClientAPI('assay')))
  server.route(require('./device/endpoints').routes.map(decorateClientAPI('device')))
  server.route(require('./deviceMaintenanceStatus/endpoints').routes.map(decorateClientAPI('device')))
  server.route(require('./deviceApiKey/endpoints').routes.map(decorateClientAPI('deviceApiKey')))
  server.route(require('./deviceType/endpoints').routes.map(decorateClientAPI('device')))
  server.route(require('./geography/endpoints').routes.map(decorateClientAPI()))
  server.route(require('./person/endpoints').routes.map(decorateClientAPI('person')))
  server.route(require('./site/endpoints').routes.map(decorateClientAPI('site')))
  server.route(require('./siteType/endpoints').routes.map(decorateClientAPI('siteType')))
  server.route(require('./result/endpoints').routes.map(decorateClientAPI('result')))
  server.route(require('./report/endpoints').routes.map(decorateClientAPI('report')))
  server.route(require('./partner/endpoints').routes.map(decorateClientAPI('partner')))
  server.route(require('./job/endpoints').routes.map(decorateClientAPI('person')))
  server.route(require('./consumable/endpoints').routes.map(decorateClientAPI('inventory')))
  server.route(require('./issue/endpoints').routes.map(decorateClientAPI('issue')))
  server.route(require('./notification/endpoints').routes.map(decorateClientAPI('notification')))
  server.route(require('./task/endpoints').routes.map(decorateClientAPI('task')))
  server.route(require('./inventory/endpoints').routes.map(decorateClientAPI('inventory')))
  server.route(require('./dashboard/endpoints').routes.map(decorateClientAPI('dashboard')))
  server.route(require('./tag/endpoints').routes.map(decorateClientAPI()))
  server.route(require('./server/endpoints').routes.map(decorateClientAPI('server')))
  server.route(require('./disease/endpoints').routes.map(decorateClientAPI('device')))
  server.route(require('./forms/endpoints').routes.map(decorateClientAPI('case')))
  server.route(require('./case/endpoints').routes.map(decorateClientAPI('case')))
  server.route(require('./resultCategoryGroup/endpoints').routes.map(decorateClientAPI()))
  server.route(require('./sample/endpoints').routes.map(decorateClientAPI('sample')))
}

function addMobileRoutes(server) {
  server.route(require('./mobileApi/result/endpoints').routes.map(decorateMobileAPI('result')))
  server.route(require('./mobileApi/person/endpoints').routes.map(decorateMobileAPI('person')))
  server.route(require('./mobileApi/entries/endpoints').routes.map(decorateMobileAPI('entry')))
  server.route(require('./mobileApi/customFields/endpoints').routes.map(decorateMobileAPI('entry')))
  server.route(require('./mobileApi/entries/sample/endpoints').routes.map(decorateMobileAPI('sample')))
  server.route(require('./mobileApi/followUp/endpoints').routes.map(decorateMobileAPI('result')))
  server.route(require('./mobileApi/config/endpoints').routes.map(decorateMobileAPI('entry')))
  server.route(require('./mobileApi/site/endpoints').routes.map(decorateMobileAPI('entry')))
}

function addDeviceRoutes(server) {
  server.route(require('./deviceApi/endpoints').routes.map(decorateDeviceAPI('device')))
}

function addDeviceRawRoutes(server) {
  server.route(require('./deviceApiRaw/endpoints').routes.map(decorateDeviceRawAPI('device/raw')))
}

// Decorates an API route with common configuration so
// it does not need to specified explicity for every route
function decorateClientAPI(module) {
  // must always be authenticated using Client JWT
  const scope = ['+clientApi']
  const strategies = ['clientApi']

  return decorateAPI({ module, scope, strategies })
}

function decorateMobileAPI(module) {
  // must always be authenticated using Client JWT
  const scope = ['+mobileApi']
  const strategies = ['mobileApi']

  return decorateAPI({ module, scope, strategies })
}

function decorateDeviceAPI() {
  // must always be authenticated using Device JWT
  const scope = ['+deviceApi']
  const strategies = ['deviceApiKey']
  return decorateAPI({ scope, strategies })
}

function decorateDeviceRawAPI() {
  const scope = ['+deviceApi']
  const strategies = ['deviceApiRawAuth']
  return decorateAPI({ scope, strategies })
}

function decorateAPI({ module, scope, strategies }) {
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
      let { auth } = config
      if (!auth) {
        // could be undefined instead of explicitly false
        auth = {}
        config.auth = auth
      }
      auth.strategies = strategies.concat(auth.strategies || [])

      if (module) {
        // Always add access to the highest permission level
        const scopeToAdd = ['admin', `${module}:admin`]

        // Add access to :edit level if :view is specified
        if (auth.scope) {
          auth.scope.forEach(s => {
            const destructuredScope = s.split(':')
            if (destructuredScope.length > 1 && destructuredScope[1] === 'view') {
              scopeToAdd.push(`${destructuredScope[0]}:edit`)
              scopeToAdd.push(`${destructuredScope[0]}:admin`)
            }

            if (destructuredScope.length > 1 && destructuredScope[1] === 'edit')
              scopeToAdd.push(`${destructuredScope[0]}:admin`)
          })
        }
        // Merge configured and dynamically added permissions
        auth.scope = uniq(scope.concat(auth.scope || []).concat(scopeToAdd))
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
    handler(request, reply)
      .then(reply)
      .catch(err => {
        Sentry.captureException(err.stack || err)
        // Log err stack and Rethrow to Hapi handles error case and Boom.500
        logger.error(err.stack || err)
        throw err
      })
}

// extracts and sanitizes the parameters related to sorting and paging
// from the candidate params and returns them as an object
function getSortPageParams(params, sortColumnMapping, defaultSort, getExtraItemToCheckNextPage = false) {
  return {
    ...getSortParams(params, sortColumnMapping, defaultSort),
    ...getPageParams(params, getExtraItemToCheckNextPage),
  }
}

// extracts and sanitizes the parameters related to sorting from the
// candidate params and returns them as an object
function getSortParams(params, sortColumnMapping, defaultSort) {
  const orders = splitCsvWithTrim(params.sortDir, 'asc')
  let columnNames = splitCsvWithTrim(params.sortCol, defaultSort)

  if (sortColumnMapping) {
    columnNames = columnNames.map(name => sortColumnMapping[name] || name)
  }

  const orderBy = columnNames.map((name, index) => ({
    column: name,
    order: orders[index] || 'asc',
  }))

  return { orderBy }
}

// extracts and sanitizes the parameters related to paging from the
// candidate params and returns them as an object
function getPageParams(params, getExtraItemToCheckNextPage = false) {
  const result = {}

  if (params.size === 'all') {
    return {
      page: 0,
      skip: 0,
      // don't define `size` prop here - meaning to get all available items
    }
  }
  const sizeParam = parseInt(params.size, 10) || 50
  result.page = parseInt(params.page, 10) || parseInt(params.offset, 10) || 0
  result.size = sizeParam + (getExtraItemToCheckNextPage ? 1 : 0)
  result.skip = result.page * sizeParam

  return result
}

function validateSortPageParams(...sortColumns) {
  return {
    sortCol:
      sortColumns.length > 0
        ? Joi.string()
            .valid(...sortColumns)
            .description('Sort on named column')
        : Joi.string().description('Sort on named column'),
    sortDir: Joi.string().valid('asc', 'desc').description('Sort order ascending or descending'),
    page: Joi.number().integer().min(0).description('Page index with 0 as first page'),
    offset: Joi.number().integer().min(0).description('Page index with 0 as first page'),
    size: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().allow('all')).description('Page size'),
  }
}

function validateDateRangeParams(isoDateFormatExpected = false) {
  if (isoDateFormatExpected)
    return {
      minDate: Joi.date().iso().allow(null).description('From Date'),
      maxDate: Joi.date().iso().allow(null).description('To Date'),
    }
  return {
    minDate: Joi.string().pattern(REGEX_ISODATESTRING).allow(null).description('From Date'),
    maxDate: Joi.string().pattern(REGEX_ISODATESTRING).allow(null).description('To Date'),
  }
}

module.exports = {
  addClientRoutes,
  addMobileRoutes,
  addDeviceRoutes,
  addDeviceRawRoutes,
  asyncHandler,
  getSortParams,
  getPageParams,
  getSortPageParams,
  validateSortPageParams,
  validateDateRangeParams,
}
