const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const { query, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const INVENTORY_ITEMS_SELECT_LIST_FIELDS = [
  'ii.id', 'ii.consumableId', 'ii.siteId', 'ii.expiresOn', 'ii.quantityOnHand',
  'c.name as consumableName', 'c.manufacturer', 'u.shortname as unitShortName',
  's.name as siteName', 's.countryId', 's.stateId', 's.lgaId',
  'co.name as countryName', 'st.name as stateName', 'l.name as lgaName'
]

const INVENTORY_ITEMS_SORT_FIELDS = {
  consumableName: 'c.name',
  manufacturer: 'c.manufacturer',
  siteName: 's.name',
  countryName: 'co.name',
  stateName: 'st.name',
  lgaName: 'l.name',
  quantityOnHand: 'ii.quantityOnHand',
  expiresOn: 'ii.expiresOn'
}

const INVENTORY_FILTER_FIELDS = { consumableId: 'ii.consumableId', siteName: 's.name', siteId: 'ii.siteId' }

const INVENTORY_DATA_CONSTRAINT_ALIASES = { country: 'co', state: 'st', lga: 'l', site: 's' }

function* listInventoryItems(request) {
  const { auth } = request

  if (request.query.sortCol &&
    !_.keys(INVENTORY_ITEMS_SORT_FIELDS).includes(request.query.sortCol)) {
    return Boom.badRequest()
  }

  const dataConstraints = yield getConstraints(auth.credentials)

  const inventoryItemsQuery = query('Search Inventory Items')
    .from('InventoryItem as ii')
    .leftOuterJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .leftOuterJoin('Unit as u', 'c.unit', 'u.id')
    .leftOuterJoin('Site as s', 'ii.siteId', 's.id')
    .leftOuterJoin('Country as co', 's.countryId', 'co.id')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterParams, request.query, INVENTORY_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_DATA_CONSTRAINT_ALIASES)

  const getCount = inventoryItemsQuery.clone()
    .count('ii.id as count').first()

  const getItems = inventoryItemsQuery.clone()
    .modify(sortPageParams, request.query, INVENTORY_ITEMS_SORT_FIELDS.siteName)
    .select(INVENTORY_ITEMS_SELECT_LIST_FIELDS)

  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

const SITES_SELECT_LIST_FIELDS = [
  's.id as siteId', 's.name as siteName', 's.countryId', 's.stateId', 's.lgaId',
  'co.name as countryName', 'st.name as stateName', 'l.name as lgaName'
]

function* getSitesAndInventoryItems(request) {
  const { auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const sitesQuery = query('Search Sites With Inventory Items')
    .from('Site as s')
    .leftOuterJoin('InventoryItem as ii', 's.id', 'ii.siteId')
    .leftOuterJoin('Country as co', 's.countryId', 'co.id')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterParams, request.query, INVENTORY_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_DATA_CONSTRAINT_ALIASES)

  const getSiteCount = sitesQuery.clone().countDistinct('s.id as count').first()

  const getSites = sitesQuery.clone()
    .modify(sortPageParams, request.query, INVENTORY_ITEMS_SORT_FIELDS.siteName)
    .distinct(SITES_SELECT_LIST_FIELDS)
    .select()

  const [{ count: total }, sitesData] = yield Promise.all([getSiteCount, getSites])

  const inventoryFilters = Object.assign({}, request.query, { siteId: _.map(sitesData, 'siteId') })

  const inventoryItems = yield query('Search Inventory Items In Sites')
    .from('InventoryItem as ii')
    .leftOuterJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .leftOuterJoin('Unit as u', 'c.unit', 'u.id')
    .leftOuterJoin('Site as s', 'ii.siteId', 's.id')
    .leftOuterJoin('Country as co', 's.countryId', 'co.id')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterParams, inventoryFilters, INVENTORY_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_DATA_CONSTRAINT_ALIASES)
    .select(INVENTORY_ITEMS_SELECT_LIST_FIELDS)

  return {
    sitesData,
    inventoryItems,
    total
  }
}

function* listInventoryItemsGroupedBySite(request) {
  if (request.query.sortCol &&
    !_.keys(INVENTORY_ITEMS_SORT_FIELDS).includes(request.query.sortCol)) {
    return Boom.badRequest()
  }

  const { sitesData, inventoryItems, total } = yield* getSitesAndInventoryItems(request)

  const sitesWithInventoryItems = _.map(sitesData, site => Object.assign({}, site, {
    inventoryItems: _.map(
      _.filter(inventoryItems, { siteId: site.siteId }), inventoryItem => _.pick(inventoryItem,
        ['id', 'consumableId', 'expiresOn', 'quantityOnHand', 'consumableName', 'manufacturer', 'unitShortName']))
  }))

  return { ok: true, total, length: sitesData.length, data: sitesWithInventoryItems }
}

function* listInventoryItemsGroupedBySiteAndConsumable(request) {
  if (request.query.sortCol &&
    !_.keys(INVENTORY_ITEMS_SORT_FIELDS).includes(request.query.sortCol)) {
    return Boom.badRequest()
  }

  const { sitesData, inventoryItems, total } = yield* getSitesAndInventoryItems(request)

  const sitesWithConsumablesAndInventoryItems = _.map(sitesData, site => Object.assign({}, site, {
    consumables: _.uniqBy(
      _.map(
        _.filter(inventoryItems, { siteId: site.siteId }), consumableInventoryItem =>
          Object.assign({}, _.pick(consumableInventoryItem, ['consumableName', 'manufacturer', 'unitShortName']), {
            consumableId: consumableInventoryItem.consumableId,
            inventoryItems: _.map(
              _.filter(inventoryItems,
                { siteId: site.siteId, consumableId: consumableInventoryItem.consumableId }),
              inventoryItem => _.pick(inventoryItem, ['id', 'expiresOn', 'quantityOnHand']))
          })), 'consumableId')
  }))

  return { ok: true, total, length: sitesData.length, data: sitesWithConsumablesAndInventoryItems }
}

module.exports = {
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  listInventoryItemsGroupedBySiteAndConsumable
}
