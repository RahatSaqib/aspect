let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, requestFilter, requestSortPage } = require('../db')
let { asyncHandler } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/device',
  handler: asyncHandler(listDevices),
  config: {
    description: 'Device List',
    notes: 'Pageable and sortable list of devices',
    tags: ['api'],
    validate: {
      query: {
        sortCol: Joi.string().valid('name', 'status', 'createdOn', 'lastSeen', 'totalTests')
          .description('Sort on named column'),
        sortDir: Joi.string().valid('asc', 'desc').description('Sort order ascending or descending'),
        page: Joi.number().integer().min(0).description('Page index with 0 as first page'),
        size: Joi.number().integer().positive().description('Page size'),
        name: Joi.string().allow('').description('Filter for device name')
      }
    }
  }
}]

function* listDevices(request){
  // get total count for paging
  let getCount = knex('device')
    .modify(requestFilter, request, 'name')
    .count('id as count').first()

  // get rows
  let getItems = knex('device')
    .modify(requestFilter, request, 'name')
    .modify(requestSortPage, request, 'name')
    .select('id', 'name', 'shortname', 'created_on', 'last_ping_on', 'updated_on as last_seen',
      knex.raw('\'Active\' as status'), knex.raw('id * 134 as total_tests'))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}
  
  return camelize(result)
}
