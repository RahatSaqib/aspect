let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, filterParams, sortPageParams } = require('../db')
let { asyncHandler, validateSortPageParams } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/device',
  handler: asyncHandler(listDevices),
  config: {
    description: 'Device List',
    notes: 'Pageable and sortable list of devices',
    validate: {
      query: Object.assign({
        name: Joi.string().allow('').description('Filter for device name')
      }, validateSortPageParams('name', 'status', 'createdOn', 'lastSeen', 'totalTests'))
    }
  }
}]

function* listDevices(request){
  let {query} = request

  // get total count for paging
  let getCount = knex('device')
    .modify(filterParams, query, 'name')
    .count('id as count').first()

  // get rows
  let getItems = knex('device')
    .modify(filterParams, query, 'name')
    .modify(sortPageParams, query, 'name')
    .select('id', 'name', 'shortname', 'created_on', 'last_ping_on', 'updated_on as last_seen',
      knex.raw('\'Active\' as status'), knex.raw('id * 134 as total_tests'))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}
  
  return camelize(result)
}
