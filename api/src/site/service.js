let Promise = require('bluebird')
let { knex, filterParams, sortPageParams } = require('../db')
let { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  's.id', 's.name', 's.shortname',
  'st.name as state', 'l.name as lga',
  's.createdOn', knex.raw('s.id + 2 as totalDevices')
]

const SELECT_SHOW_FIELDS = [
  's.id', 's.name', 's.shortname',
  'st.name as state', 'l.name as lga',
  's.createdOn', knex.raw('s.id + 2 as totalDevices'),

  'ct.name as country',
  's.timezoneId as timezone', // FIXME?
  's.city', 's.zip', 's.street1', 's.street2',
  's.longitude', 's.latitude'
]

function* listSites(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let siteQuery = knex('Site as s')
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
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return result
}

function* showSite(request) {
  const {params} = request

  // get item
  const [item] = yield knex('Site as s')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Country as ct', 's.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .where('s.id', params.siteId)
    .select(SELECT_SHOW_FIELDS)

  const result = {ok: true, data: item}

  return result
}

module.exports = {
  listSites,
  showSite
}
