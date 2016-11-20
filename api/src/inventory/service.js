const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const {
  query,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
  sortParams
} = require('../db')
const {
  getConstraints,
  addConstraints
} = require('../auth/constraints')

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

const INVENTORY_FILTER_FIELDS = {
  countryId: 's.countryId',
  stateId: 's.stateId',
  lgaId: 's.lgaId',
  consumableId: 'ii.consumableId',
  siteName: 's.name',
  siteId: 'ii.siteId'
}

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
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Country as co', 's.countryId', 'co.id')
    .leftJoin('State as st', 's.stateId', 'st.id')
    .leftJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, INVENTORY_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_DATA_CONSTRAINT_ALIASES)

  const getCount = inventoryItemsQuery.clone()
    .count('ii.id as count').first()

  const getItems = inventoryItemsQuery.clone()
    .modify(sortPageParams, request.query,
      INVENTORY_ITEMS_SORT_FIELDS.siteName, INVENTORY_ITEMS_SORT_FIELDS)
    .select(INVENTORY_ITEMS_SELECT_LIST_FIELDS)

  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

function* getInventoryItemsForSites(request) {
  const { auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const inventorySiteAndGeographyQuery = query('Join Inventory Details, Site Details, and Geography Details')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Country as co', 's.countryId', 'co.id')
    .leftJoin('State as st', 's.stateId', 'st.id')
    .leftJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')

  const sitesQuery = inventorySiteAndGeographyQuery.clone()
    .modify(filterParams, request.query, INVENTORY_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_DATA_CONSTRAINT_ALIASES)

  const getSiteCount = sitesQuery.clone()
    .countDistinct('ii.siteId as count').first()

  const getSites = sitesQuery.clone()
    .modify(sortPageParams, request.query,
      INVENTORY_ITEMS_SORT_FIELDS.siteName, INVENTORY_ITEMS_SORT_FIELDS)
    .distinct('ii.siteId')
    .select()

  const [{ count: total }, sitesData] = yield Promise.all([getSiteCount, getSites])

  const inventoryFilters = Object.assign({}, request.query, { siteId: _.map(sitesData, 'siteId') })

  const inventoryItems = yield inventorySiteAndGeographyQuery.clone()
    .modify(filterParams, inventoryFilters, INVENTORY_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_DATA_CONSTRAINT_ALIASES)
    .modify(sortParams, request.query,
      INVENTORY_ITEMS_SORT_FIELDS.siteName, INVENTORY_ITEMS_SORT_FIELDS)
    .select(INVENTORY_ITEMS_SELECT_LIST_FIELDS)

  return {
    inventoryItems,
    total
  }
}

function* listInventoryItemsGroupedBySite(request) {
  if (request.query.sortCol &&
    !_.keys(INVENTORY_ITEMS_SORT_FIELDS).includes(request.query.sortCol)) {
    return Boom.badRequest()
  }

  const { inventoryItems, total } = yield* getInventoryItemsForSites(request)

  const siteFields = ['siteId', 'siteName', 'countryId', 'stateId', 'lgaId', 'countryName', 'stateName', 'lgaName']
  const inventoryItemFields = ['consumableId', 'consumableName', 'manufacturer', 'unitShortName', 'id', 'expiresOn', 'quantityOnHand']
  const sites = _.uniqBy(
    _.map(inventoryItems, inventoryItem =>
      _.pick(inventoryItem, siteFields)), 'siteId')
  const sitesWithInventoryItems = _.map(sites, (siteRecord) => {
    const siteItems = _.filter(inventoryItems, { siteId: siteRecord.siteId })
    return Object.assign({},
      siteRecord,
      {
        inventoryItems: _.map(siteItems,
          siteItem => _.pick(siteItem, inventoryItemFields))
      })
  })

  return { ok: true, total, length: sitesWithInventoryItems.length, data: sitesWithInventoryItems }
}

function* listInventoryItemsGroupedBySiteAndConsumable(request) {
  if (request.query.sortCol &&
    !_.keys(INVENTORY_ITEMS_SORT_FIELDS).includes(request.query.sortCol)) {
    return Boom.badRequest()
  }

  const { inventoryItems, total } = yield* getInventoryItemsForSites(request)

  const siteFields = ['siteId', 'siteName', 'countryId', 'stateId', 'lgaId', 'countryName', 'stateName', 'lgaName']
  const consumableFields = ['consumableId', 'consumableName', 'manufacturer', 'unitShortName']
  const inventoryItemFields = ['id', 'expiresOn', 'quantityOnHand']
  const sites = _.uniqBy(
    _.map(inventoryItems, inventoryItem =>
      _.pick(inventoryItem, siteFields)), 'siteId')
  const consumables = _.uniqWith(
    _.map(inventoryItems, inventoryItem =>
      _.pick(inventoryItem, siteFields.concat(consumableFields))), _.isEqual)

  const sitesWithConsumablesWithInventoryItems = _.map(sites, (siteRecord) => {
    const siteConsumables = _.filter(consumables, { siteId: siteRecord.siteId })
    return Object.assign({},
      siteRecord,
      {
        consumables: _.map(siteConsumables, (consumableRecord) => {
          const consumableItems = _.filter(inventoryItems, {
            siteId: consumableRecord.siteId,
            consumableId: consumableRecord.consumableId
          })
          return Object.assign({},
            _.pick(consumableRecord,
              consumableFields),
            {
              inventoryItems: _.map(consumableItems,
                consumableItem => _.pick(consumableItem, inventoryItemFields))
            })
        })
      })
  })

  return {
    ok: true,
    total,
    length: sitesWithConsumablesWithInventoryItems.length,
    data: sitesWithConsumablesWithInventoryItems
  }
}

module.exports = {
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  listInventoryItemsGroupedBySiteAndConsumable
}
