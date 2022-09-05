const _ = require('lodash')
const {
  INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS,
  INVENTORY_ITEM_SORT_FIELDS,
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
} = require('./common/querySelectors')
const { knex, sortPageParams, filterParams, filterDateRangeParams, query } = require('../db')
const { addConstraints, getConstraints } = require('../auth/constraints')
const { getInventorySitesQuery } = require('./common/db')
const { splitCsvWithTrim } = require('../shared/string')

const CONCATENATED_ID = `CONCAT(
  c.id,
  '-',
  s.id,
  '-',
  IFNULL(
    CASE
      WHEN c.strategy IS NOT NULL
      AND INSTR(c.strategy, 'expirationDate') > 0
      THEN ii.expiresOn
      ELSE ''
    END,
    '-'
  ),
  '-',
  IFNULL(
    CASE
      WHEN c.strategy IS NOT NULL
      AND INSTR(c.strategy, 'withlot') > 0
      THEN ii.lotNumber
      ELSE ''
    END,
    ''
  ),
  '-',
  IFNULL(ii.inTransitFromSiteId, '')
)`

async function listInventory(request) {
  const { auth, query } = request
  const { breakOutByLot } = query

  const dataConstraints = await getConstraints(auth.credentials)

  let data
  let total

  if (breakOutByLot) {
    ;({ total, data } = await listInventoryByLot(request, dataConstraints))
  } else {
    ;({ total, data } = await listInventoryBySiteAndConsumable(request, dataConstraints))
  }
  return { ok: true, total, length: data.length, data }
}

async function listInventoryByLot(request, dataConstraints) {
  const inventoryQuery = getInventoryLots(request, dataConstraints)

  const getCount = knex.from(inventoryQuery.clone().as('q')).count({ count: 'q.id' }).first()

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

  const getItems = inventoryQuery
    .clone()
    .modify(sortPageParams, requestQuery, INVENTORY_ITEM_SORT_FIELDS.siteName, INVENTORY_ITEM_SORT_FIELDS)

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { total, data }
}

async function listInventoryBySiteAndConsumable(request, dataConstraints) {
  const { query } = request
  const range = getDaysStockLeftRanges(query.daysStockLeft)

  let inventoryQuery = getInventorySitesQuery(dataConstraints, request)

  inventoryQuery = knex
    .from(inventoryQuery.as('t2'))
    .modify(builder => {
      if (range) {
        builder.whereRaw(
          `daysStockLeft IS NOT NULL
          AND
          daysStockLeft >= ${range.min}
          ${_.isNil(range.max) ? '' : ` AND daysStockLeft <= ${range.max}`}
          `
        )
      }
    })
    .select(`*`)
  const [{ total }] = await inventoryQuery.clone().count('id as total')

  // sorting and pagination
  inventoryQuery = inventoryQuery.modify(sortPageParams, request.query, 'siteName')

  const inventorySites = await inventoryQuery

  return { data: inventorySites, total }
}

function getInventoryLots(request, dataConstraints) {
  const inventoryItemsQuery = query('Search Inventory Lots')
    .from('Site as s')
    .innerJoin('Consumable as c')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('InventoryItem as ii', builder => {
      builder.on('s.id', 'ii.siteId').andOn('c.id', 'ii.consumableId')
    })
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      ...SUM_STOCK_LEFT_FILTER_FIELDS,
    })
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)
    .groupBy([
      knex.raw(CONCATENATED_ID),

      's.name',
      knex.raw(`CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN ii.lotNumber ELSE null END`),
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN ii.expiresOn ELSE null END`
      ),
      'ii.inTransitFromSiteId',
    ])
    .select(
      ...INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS,
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN TRUE ELSE FALSE END AS showLot`
      ),
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN TRUE ELSE FALSE END AS showExpirationDate`
      )
    )

  return inventoryItemsQuery
}

function getDaysStockLeftRanges(key) {
  switch (key) {
    case 'outOfStock':
      return { min: 0, max: 0 }
    case 'upTo14':
      return { min: 1, max: 14 }
    case 'upTo30':
      return { min: 15, max: 30 }
    case 'upTo90':
      return { min: 31, max: 90 }
    case 'upTo180':
      return { min: 91, max: 180 }
    case 'moreThan180':
      return { min: 181 }
    default:
      return null
  }
}

module.exports = listInventory
