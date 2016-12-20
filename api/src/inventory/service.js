const Promise = require('bluebird')
const _ = require('lodash')
const {
  knex,
  query,
  filterParams,
  filterDateRangeParams,
  sortPageParams
} = require('../db')
const {
  getConstraints,
  addConstraints
} = require('../auth/constraints')
const { selectAssayConsumables } = require('../consumable/assayConsumableService')

const INVENTORY_ITEM_SELECT_LIST_FIELDS = [
  'ii.id', 'ii.consumableId', 'ii.siteId', 'ii.expiresOn', 'ii.quantityOnHand',
  'c.name as consumableName', 'c.manufacturer', 'u.shortname as unitShortName',
  's.name as siteName', 'g.countryId', 'g.stateId', 'g.lgaId',
  'co.name as countryName', 'st.name as stateName', 'l.name as lgaName'
]

const INVENTORY_ITEM_SORT_FIELDS = {
  consumableName: 'c.name',
  manufacturer: 'c.manufacturer',
  siteName: 's.name',
  countryName: 'co.name',
  stateName: 'st.name',
  lgaName: 'l.name',
  quantityOnHand: 'ii.quantityOnHand',
  expiresOn: 'ii.expiresOn'
}

const INVENTORY_ITEM_FILTER_FIELDS = {
  countryId: 'g.countryId',
  stateId: 'g.stateId',
  lgaId: 'g.lgaId',
  consumableId: 'ii.consumableId',
  siteName: 's.name',
  siteId: 'ii.siteId'
}

const INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES = { country: 'co', state: 'st', lga: 'l', site: 's' }

function selectInventoryItemsAtSite(siteId, knex) {
  return knex('InventoryItem')
    .where({ siteId })
    .select()
}

function compareConsumableInResultWithInventoryItem(consumableInResult,
  inventoryItem, mustMatchExpirationDate, mustMatchLotNumber) {
  const resultExpirationDate = consumableInResult.expirationDate ?
    new Date(consumableInResult.expirationDate) : null
  const inventoryItemExpirationDate = inventoryItem.expiresOn
  const resultLotNumber = consumableInResult.lot ? consumableInResult.lot : null
  const inventoryItemLotNumber = inventoryItem.lotNumber ? inventoryItem.lotNumber : null

  return (_.isEqual(resultExpirationDate, inventoryItemExpirationDate) &&
    (!mustMatchLotNumber || _.isEqual(resultLotNumber, inventoryItemLotNumber))) ||
    (!mustMatchExpirationDate && _.isEqual(resultLotNumber, inventoryItemLotNumber))
}

function inventoryItemExistsInResultData(consumablesInResultData,
  inventoryItem, mustMatchExpirationDate, mustMatchLotNumber) {
  return _.some(consumablesInResultData,
    consumableInResultData =>
      compareConsumableInResultWithInventoryItem(
        consumableInResultData, inventoryItem, mustMatchExpirationDate, mustMatchLotNumber))
}

function findInventoryItemMatchingConsumableInResultData(
  consumablesInResultData, inventoryItems) {
  return _.find(inventoryItems,
    inventoryItems =>
    inventoryItemExistsInResultData(
      consumablesInResultData, inventoryItems, true, true)) ||
    _.find(inventoryItems,
      inventoryItem =>
      inventoryItemExistsInResultData(
        consumablesInResultData, inventoryItem, true)) ||
    _.find(inventoryItems,
      inventoryItem =>
      inventoryItemExistsInResultData(
        consumablesInResultData, inventoryItem))
}

function* consumeInventoryForResult(
  resultId, assayId, siteId, consumablesInResultData, partnerId, knex) {
  const now = new Date()
  const assayConsumables = yield selectAssayConsumables(knex, partnerId, assayId)
  const inventoryItemsAtSite = yield selectInventoryItemsAtSite(siteId, knex)
  const { testRunConsumableReasonId } = yield knex('ConsumableReason as cr')
    .where({ 'cr.name': 'Test Conducted', 'cr.decrease': 1 })
    .first('cr.id as testRunConsumableReasonId')

  const firstUnknownConsumableInResult = _.find(consumablesInResultData,
      consumableInResultData => !_.some(inventoryItemsAtSite,
        inventoryItem =>
          !compareConsumableInResultWithInventoryItem(
            consumableInResultData, inventoryItem))) ||
    _.isEmpty(consumablesInResultData) ? {
      lot: null,
      expirationDate: null,
      serial: null
    } : consumablesInResultData[0]

  for (const assayConsumable of assayConsumables) {
    // Find Inventory on hand where lot number and expiry date match
    const matchingInventoryItems = _.filter(inventoryItemsAtSite, {
      consumableId: assayConsumable.consumableId
    })
    const matchingInventoryOnHand =
      findInventoryItemMatchingConsumableInResultData(
        consumablesInResultData, matchingInventoryItems) ||
        {
          id: null,
          lotNumber: firstUnknownConsumableInResult.lot,
          expiresOn: firstUnknownConsumableInResult.expirationDate ?
            new Date(firstUnknownConsumableInResult.expirationDate) : null
        }
    yield knex('InventoryLog').insert({
      inventoryItemId: matchingInventoryOnHand.id,
      consumableId: assayConsumable.consumableId,
      siteId,
      consumableReasonId: testRunConsumableReasonId,
      resultId,
      lotNumber: matchingInventoryOnHand.lotNumber,
      expiresOn: matchingInventoryOnHand.expiresOn,
      quantity: assayConsumable.quantity,
      createdOn: now
    })
    if (matchingInventoryOnHand.id) {
      yield knex('InventoryItem')
        .where({ id: matchingInventoryOnHand.id })
        .update({
          quantityOnHand: knex.raw(`quantityOnHand - ${assayConsumable.quantity}`),
          updatedOn: now
        })
    }
  }
}

function* listInventoryItems(request) {
  const { auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const inventoryItemsQuery = query('Search Inventory Items')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, INVENTORY_ITEM_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)

  const getCount = inventoryItemsQuery.clone()
    .count('ii.id as count').first()

  const getItems = inventoryItemsQuery.clone()
    .modify(sortPageParams, request.query,
      INVENTORY_ITEM_SORT_FIELDS.siteName, INVENTORY_ITEM_SORT_FIELDS)
    .select(INVENTORY_ITEM_SELECT_LIST_FIELDS)

  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

function* listInventoryItemsGroupedBySite(request) {
  const { auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const inventoryItemsSiteByGeographyQuery = query('Join Inventory Items, Site Details, and Geography Details')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')

  const sitesQuery = inventoryItemsSiteByGeographyQuery.clone()
    .modify(filterParams, request.query, INVENTORY_ITEM_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)

  const getSiteCount = sitesQuery.clone()
    .countDistinct('ii.siteId as count').first()

  const sortAggregate = request.query.sortDir === 'desc' ? 'MAX' : 'MIN'
  const sortColumnName = request.query.sortCol || 'siteName'
  let sortColumnField = INVENTORY_ITEM_SORT_FIELDS[sortColumnName]
  if (sortColumnName === 'expiresOn') {
    const defaultDateOrderBy = request.query.sortDir === 'desc' ? '1000-01-01 00:00:00' : '9999-12-31 23:59:59'
    sortColumnField = `COALESCE(${INVENTORY_ITEM_SORT_FIELDS[sortColumnName]}, '${defaultDateOrderBy}')`
  }
  const aggregateColumn = `${sortAggregate}(${sortColumnField}) as ${sortColumnName}`
  const getSiteIds = sitesQuery.clone()
    .groupBy('ii.siteId')
    .select('ii.siteId', knex.raw(aggregateColumn))
    .modify(sortPageParams, request.query, sortColumnName)

  const [{ count: total }, sitesData] = yield Promise.all([getSiteCount, getSiteIds])

  const inventoryItemFilters = Object.assign({}, request.query, { siteId: _.map(sitesData, 'siteId') })

  const sortDirection = request.query.sortDir === 'desc' ? 'desc' : 'asc'
  const inventoryItems = yield inventoryItemsSiteByGeographyQuery.clone()
    .modify(filterParams, inventoryItemFilters, INVENTORY_ITEM_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)
    .orderBy('sortBy', sortDirection)
    .select([...INVENTORY_ITEM_SELECT_LIST_FIELDS, knex.raw(`${sortColumnField} as sortBy`)])

  const siteFields = ['siteId', 'siteName', 'countryId', 'stateId', 'lgaId', 'countryName', 'stateName', 'lgaName']
  const inventoryItemFields = ['consumableId', 'consumableName', 'manufacturer', 'unitShortName', 'id', 'expiresOn', 'quantityOnHand']
  const sites = _.uniqBy(
    _.map(inventoryItems, inventoryItem =>
      _.pick(inventoryItem, siteFields)), 'siteId')
  const sitesWithConsumables = _.map(sites, (siteRecord) => {
    const siteItems = _.filter(inventoryItems, { siteId: siteRecord.siteId })
    return Object.assign({},
      siteRecord,
      {
        inventoryItems: _.map(siteItems,
          siteItem => _.pick(siteItem, inventoryItemFields))
      })
  })

  return { ok: true, total, length: sitesWithConsumables.length, data: sitesWithConsumables }
}

module.exports = {
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  consumeInventoryForResult
}
