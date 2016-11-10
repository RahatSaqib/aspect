const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const { knex, query, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'c.id', 'c.name', 'u.name as unit', 'c.canExpire', 'c.manufacturer', 'c.autoInclude'
]
function* listConsumableTypes(request) {
  const { query } = request

  const consumableQuery = knex('Consumable as c')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .modify(filterParams, query, { name: 'c.name' })

  // get total count for paging
  const getCount = consumableQuery.clone()
    .count('c.id as count').first()

  // get rows
  const getItems = consumableQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function* listConsumableReasons(request) {
  const { query } = request

  // TODO: use dataContraints
  const consumableReasonQuery = knex('ConsumableReason as cr')
    .modify(filterParams, query, { name: 'cr.name' })

  // get total count for paging
  const getCount = consumableReasonQuery.clone()
    .count('cr.id as count').first()

  // get rows
  const getItems = consumableReasonQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(['id', 'name', 'decrease'])

  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

const INVENTORY_ITEMS_SELECT_LIST_FIELDS = [
  'ii.id', 'ii.consumableId', 'ii.siteId', 'ii.expiresOn', 'ii.quantityOnHand',
  'c.name as consumableName', 'c.manufacturer as manufacturer', 'u.shortname as unitShortName',
  's.name as siteName', 's.countryId', 's.stateId', 's.lgaId',
  'co.name as countryName', 'st.name as stateName', 'l.name as lgaName'
]

const INVENTORY_ITEMS_SORT_FIELDS = {
  'consumableName': 'c.name',
  'manufacturer': 'c.manufacturer',
  'siteName': 's.name',
  'countryName': 'co.name',
  'stateName': 'st.name',
  'lgaName': 'l.name',
  'quantityOnHand': 'ii.quantityOnHand',
  'expiresOn': 'ii.expiresOn'
}

function* listInventoryItems(request){
  const {auth} = request

  if (request.query.sortCol && !_.keys(INVENTORY_ITEMS_SORT_FIELDS).includes(request.query.sortCol)){
    return Boom.badRequest()
  }

  let dataConstraints = yield getConstraints(auth.credentials)

  let inventoryItemsQuery = query('Search Inventory Items')
    .from('InventoryItem as ii')
    .leftOuterJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .leftOuterJoin('Unit as u', 'c.unit', 'u.id')
    .leftOuterJoin('Site as s', 'ii.siteId', 's.id')
    .leftOuterJoin('Country as co', 's.countryId', 'co.id')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterParams, request.query, {consumableId: 'ii.consumableId', siteName: 's.name' })
    .modify(addConstraints, dataConstraints, {country: 'co', state: 'st', lga: 'l', site: 's'})

  const getCount = inventoryItemsQuery.clone()
    .count('ii.id as count').first()

  const getItems = inventoryItemsQuery.clone()
    .modify(sortPageParams, request.query, INVENTORY_ITEMS_SORT_FIELDS['siteName'])
    .select(INVENTORY_ITEMS_SELECT_LIST_FIELDS)

  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  return {ok: true, total, length: data.length, data}
}

function* listInventoryItemsGroupedBySite(request) {

}

function* listInventoryItemsGroupedByConsumable(request) {

}

function* listInventoryItemsGroupedBySiteConsumable(request) {

}
module.exports = {
  listConsumableTypes,
  listConsumableReasons,
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  listInventoryItemsGroupedByConsumable,
  listInventoryItemsGroupedBySiteConsumable
}
