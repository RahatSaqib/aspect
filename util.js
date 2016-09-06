let Promise = require('bluebird')
let decamelize = require('decamelize')
let Boom = require('boom')
let Joi = require('joi')

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

  result.sortCol = params.sortCol ? decamelize(params.sortCol) : defaultSort
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
  asyncHandler,
  getSortPageParams,
  validateSortPageParams
}
