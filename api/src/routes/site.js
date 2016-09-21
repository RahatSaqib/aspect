let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, filterParams, sortPageParams } = require('../db')
let { asyncHandler, validateSortPageParams } = require('../util')
let { getConstraints, addConstraints } = require('../constraints')

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
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let siteQuery = knex('site as s')
    .leftOuterJoin('partner as p', 's.partner_id', 'p.id')
    .leftOuterJoin('country as c', 's.country_id', 'c.id')
    .leftOuterJoin('state as st', 's.state_id', 'st.id')
    .leftOuterJoin('lga as l', 's.lga_id', 'l.id')
    .modify(filterParams, query, 'name', 's.name')
    .modify(addConstraints, dataConstraints, {partner: 'p', country: 'c', state: 'st', lga: 'l'})

  // get total count for paging
  let getCount = siteQuery.clone()
    .count('s.id as count').first()

  // get rows
  let getItems = siteQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select('s.id', 's.name', 's.shortname',
      'st.name as state', 'l.name as lga',
      's.created_on', knex.raw('s.id + 2 as total_devices'))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return camelize(result)
}
