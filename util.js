let Promise = require('bluebird')
let decamelize = require('decamelize')
let Boom = require('boom')

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
      reply(Boom.wrap(err, 500))
    }
  })
}


// extracts the parameters related to sorting and paging from the query
// string and returns them as an object
function getSortPageParams(req, defaultSort){
  let params = {}

  /*FIXME
  req.sanitize('sortcol').trim()
  req.sanitize('sortDir').whitelist(['desc', 'asc'])
  req.sanitize('page').toInt()
  req.sanitize('size').toInt()
  */

  params.sortCol = req.query.sortCol ? decamelize(req.query.sortCol) : defaultSort
  params.sortDir = req.query.sortDir == 'desc' ? 'desc' : 'asc'
  params.page = parseInt(req.query.page) || 0
  params.size = parseInt(req.query.size) || 20
  params.skip = params.page * params.size

  return params
}

module.exports = {
  asyncHandler,
  getSortPageParams
}
