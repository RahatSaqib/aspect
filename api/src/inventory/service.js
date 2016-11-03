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
    .leftJoin('Unit as u', 'c.unit', 'u.id')
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

function* listConsumableReasons(request){
  const {query, auth} = request

  //Get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)
  //TODO: use dataContraints
  const consumableReasonQuery = knex('ConsumableReason as cr')
    .modify(filterParams, query, {'name': 'cr.name'})

  // get total count for paging
  const getCount = consumableReasonQuery.clone()
    .count('cr.id as count').first()

  //get rows
  const getItems = consumableReasonQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(['id', 'name', 'decrease'])

  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  const result = {ok: true, total, length: data.length, data}

  return result
}

module.exports = {
  listConsumableTypes,
  listConsumableReasons
}
