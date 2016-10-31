const Promise = require('bluebird')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'c.id', 'c.name', 'u.name as unit', 'c.canExpire', 'c.manufacturer','c.autoInclude'
]
function* listConsumableTypes(request){
  const {query, auth} = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const consumableQuery = knex('Consumable as c')
    .leftJoin('Units as u', 'c.unit', 'u.id')
    .modify(filterParams, query, { 'name': 'c.name' })

  // get total count for paging
  const getCount = consumableQuery.clone()
    .count('c.id as count').first()

  // get rows
  const getItems = consumableQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  const result = {ok: true, total, length: data.length, data}

  return result
}

module.exports = {
  listConsumableTypes
}
