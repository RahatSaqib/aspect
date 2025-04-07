const { getConstraints } = require('../auth/constraints')
const {
  appendSiteConsumables,
  getInventoryBySitesAndConsumableQuery,
  getInventoryByLotQuery,
  getConsumableStrategy,
} = require('./common/db')
const { knex, sortPageParams } = require('../db')

const { splitCsvWithTrim } = require('../shared/string')
const { DAYS_STOCK_LEFT_RANGES } = require('../shared/constants')
const { INVENTORY_ITEM_SORT_FIELDS } = require('./common/querySelectors')

module.exports = async function (request) {
  const { auth, query } = request
  const { breakOutByLot } = query

  const dataConstraints = await getConstraints(auth.credentials)

  const { total, data } = breakOutByLot
    ? await listInventoryByLot(request, dataConstraints)
    : await listInventoryBySiteAndConsumable(request, dataConstraints)

  /**
   * for each site - get array of consumableId's from SiteConsumable table
   */
  const dataWithSiteConsumables = await appendSiteConsumables(data)

  return { ok: true, total, length: dataWithSiteConsumables.length, data: dataWithSiteConsumables }
}

async function listInventoryByLot(request, dataConstraints) {
  const requestQuery = request.query
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

  const partnerId = dataConstraints.partner.id
  const consumableStrategy = await getConsumableStrategy(partnerId)
  const inventoryQuery = getInventoryByLotQuery(request, dataConstraints, consumableStrategy)

  const getCount = knex.from(inventoryQuery.clone().as('q')).count({ count: 'q.id' }).first()
  const getItems = inventoryQuery
    .clone()
    .modify(sortPageParams, requestQuery, INVENTORY_ITEM_SORT_FIELDS.siteName, INVENTORY_ITEM_SORT_FIELDS)

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { total, data }
}

async function listInventoryBySiteAndConsumable(request, dataConstraints) {
  const { query } = request
  const range = DAYS_STOCK_LEFT_RANGES[query.daysStockLeft] || null

  const inventoryQuery = getInventoryBySitesAndConsumableQuery(request, dataConstraints, range, '*', true)

  const getCount = inventoryQuery.clone().count('id as count').first()
  const getItems = inventoryQuery.clone().modify(sortPageParams, request.query, 'siteName')

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { data, total }
}
