const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')

const { knex, pageParams, sortParams } = require('../db')
const { getConstraints } = require('../auth/constraints')
const utils = require('./utils')

const { splitCsvWithTrim } = require('../shared/string')
const { getInventorySitesQuery, filteredInventoryItemsBase } = require('./common/db')
const {
  INVENTORY_ITEM_SORT_FIELDS,
  INVENTORY_ITEM_SELECT_LIST_FIELDS,
  INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS,
  SUPPLY_IN_STOCK_FIELDS,
} = require('./common/querySelectors')

const siteFields = ['siteId', 'siteName', 'countryId', 'stateId', 'lgaId', 'countryName', 'stateName', 'lgaName']
const inventoryItemFields = [
  'consumableId',
  'consumableName',
  'manufacturer',
  'unitShortName',
  'id',
  'expiresOn',
  'lotNumber',
  'quantityOnHand',
  'canExpire',
  'inTransitFromSiteId',
  'inTransitFromSiteName',
  'stockLeft',
  'dailyConsumptionRate',
]

// ----------------------------------------------------------------------------------
async function listInventoryGroupedBySite(request) {
  const { auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  /**
   * Make sure list of supplies is always sorted by min 2 fields - siteName and consumableName.
   * If other columns are clicked in UI - then sort first by that column,
   * and then by siteName and consumableName.
   */
  const requestQuery = _.cloneDeep(request.query)
  if (requestQuery.sortCol) {
    let sortCols = splitCsvWithTrim(requestQuery.sortCol)
    if (!sortCols.includes('siteName')) {
      sortCols = [...sortCols, 'siteName']
    }
    if (!sortCols.includes('consumableName')) {
      sortCols = [...sortCols, 'consumableName']
    }
    requestQuery.sortCol = sortCols.join(',')
  }

  const inventoryItemsQuery = filteredInventoryItemsBase(request, dataConstraints).modify(
    sortParams,
    requestQuery,
    INVENTORY_ITEM_SORT_FIELDS.siteName,
    INVENTORY_ITEM_SORT_FIELDS
  )

  const getSiteCount = inventoryItemsQuery.clone().countDistinct('s.id as count').first()

  const getSiteIds = inventoryItemsQuery
    .clone()
    .groupBy('s.id')
    .select('s.id as siteId')
    .modify(pageParams, requestQuery)

  const [{ count: total }, sitesData] = await Promise.all([getSiteCount, getSiteIds])
  const siteIdsOnPage = sitesData.map(({ siteId }) => siteId)

  let fieldsToSelect
  if (requestQuery.breakOutByLot) {
    fieldsToSelect = [
      ...INVENTORY_ITEM_SELECT_LIST_FIELDS.filter(x => x !== 'ii.id'),
      // add alias 'id' for combo of siteId, consumableId and inventoryItemId
      knex.raw(`concat(s.id, '_', c.id, '_', ifnull(ii.id,0)) as id`),
      'stock.stockLeft',
      'ficr.rate as dailyConsumptionRate',
    ]
  } else fieldsToSelect = INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS.filter(x => x !== 'ii.id')

  const inventoryItems = await inventoryItemsQuery.whereIn('s.id', siteIdsOnPage).select([
    // except 'ii.id'
    ...fieldsToSelect,
  ])

  const sites = _.uniqBy(
    _.map(inventoryItems, inventoryItem => _.pick(inventoryItem, siteFields)),
    'siteId'
  )
  const sitesWithConsumables = _.map(sites, siteRecord => {
    const siteItems = _.filter(inventoryItems, { siteId: siteRecord.siteId })
    return {
      ...siteRecord,
      inventoryItems: _.map(siteItems, siteItem => _.pick(siteItem, inventoryItemFields)),
    }
  })

  return {
    ok: true,
    total,
    length: sitesWithConsumables.length,
    data: sitesWithConsumables,
  }
}

// ----------------------------------------------------------------------------------
async function getDaysByLocation(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  /*
  // --------
  // old query
  // --------
  const baseWithCalculatedFields =
    getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(
      request,
      dataConstraints
    )
  */
  const baseWithCalculatedFields = getInventorySitesQuery(dataConstraints, request)

  // -----------------
  // group by location fields and consumableId, and return different counts
  const result = await knex
    .from(baseWithCalculatedFields.as('t2'))
    .groupBy('consumableId')
    .select(SUPPLY_IN_STOCK_FIELDS)

  return {
    ok: true,
    total: result.length,
    data: result,
  }
}

// ----------------------------------------------------------------------------------
async function doChangeInventory(request, handler) {
  const res = await handler(request)
  if (Boom.isBoom(res)) return res
  return {
    ok: true,
    data: res, // see corresponding handler func for details about it's response
  }
}

// ----------------------------------------------------------------------------------
async function addInventory(request) {
  return doChangeInventory(request, utils.addInventory)
}

// ----------------------------------------------------------------------------------
async function removeInventory(request) {
  return doChangeInventory(request, utils.removeInventory)
}

// ----------------------------------------------------------------------------------
async function transferInventory(request) {
  return doChangeInventory(request, utils.transferInventoryWithAuth)
}

// ----------------------------------------------------------------------------------
async function receiveInventory(request) {
  return doChangeInventory(request, utils.receiveInventoryWithAuth)
}

// ----------------------------------------------------------------------------------
async function selectInventoryStockAtSite(siteId, consumableId) {
  return knex('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .where({ consumableId, siteId })
    .first(knex.raw('coalesce(sum(ii.quantityOnHand),0) as totalInStock'))
}

// ----------------------------------------------------------------------------------
async function modifyInventoryOnHand(request) {
  return utils.modifyInventoryOnHand(request)
}

module.exports = {
  listInventoryGroupedBySite,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  selectInventoryStockAtSite,
  getDaysByLocation,
  modifyInventoryOnHand,
}
