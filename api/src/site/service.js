let camelize = require('camelize')
let Promise = require('bluebird')
let { knex, filterParams, sortPageParams } = require('../db')
let { getConstraints, addConstraints } = require('../auth/constraints')

function* listSites(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let siteQuery = knex('site as s')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterParams, query, 'name', 's.name')
    .modify(addConstraints, dataConstraints, {site: 's', state: 'st', lga: 'l'})

  // get total count for paging
  let getCount = siteQuery.clone()
    .count('s.id as count').first()

  // get rows
  let getItems = siteQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select('s.id', 's.name', 's.shortname',
      'st.name as state', 'l.name as lga',
      's.createdOn', knex.raw('s.id + 2 as total_devices'))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return camelize(result)
}

module.exports = {
  listSites
}
