let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, filterParams, sortPageParams } = require('../db')
let { asyncHandler, validateSortPageParams } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/site',
  handler: asyncHandler(listSites),
  config: {
    description: 'Site List',
    notes: 'Pageable and sortable list of sites',
    validate: {
      query: Object.assign({
        name: Joi.string().allow('').description('Filter for site name')
      }, validateSortPageParams('name', 'shortname', 'state', 'lga', 'created_on', 'totalDevices'))
    }
  }
}]

function* listSites(request){
  let {query} = request

  // get total count for paging
  let getCount = knex('site')
    .modify(filterParams, query, 'name')
    .count('id as count').first()

  // get rows
  let getItems = knex('site')
    .modify(filterParams, query, 'name')
    .modify(sortPageParams, query, 'name')
    .select('id', 'name', 'shortname', knex.raw('\'Ohio\' as state'), knex.raw('\'Wayne\' as lga'), 'created_on', knex.raw('id + 2 as total_devices'))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return camelize(result)
}
