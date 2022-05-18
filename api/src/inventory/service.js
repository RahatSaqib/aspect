const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getDateOrDefault, parseDateOrDefault } = require('../shared/date')
const {
  knex,
  transact,
  query,
  filterParams,
  filterDateRangeParams,
  pageParams,
  sortParams,
  sortPageParams,
} = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const {
  selectAssayConsumables,
} = require('../consumable/assayConsumableService')
const { findConsumableReason } = require('../consumable/consumableService')
const { getUser } = require('../auth/service')
const { getSite } = require('../site/service')
const { resolveIssues, escalateIssues } = require('../issue/actions')
const { inventoryStockout, inventoryStockExpiring } = require('./actions')
const {
  auditInventoryStockout,
  auditInventoryStockExpiring,
} = require('../shared/utilsInventory')
const { splitCsvWithTrim } = require('../shared/string')

const INVENTORY_COMMON_FIELDS = [
  'c.id as consumableId',
  'c.name as consumableName',
  'c.manufacturer',
  'c.canExpire',
  'u.shortName as unitShortName',
  's.id as siteId',
  's.name as siteName',
  'g.countryId',
  'g.stateId',
  'g.lgaId',
  'co.name as countryName',
  'st.name as stateName',
  'l.name as lgaName',
]

const INVENTORY_ITEM_SELECT = [
  ...INVENTORY_COMMON_FIELDS,
  'ii.quantityOnHand',
  'ii.id',
  'ii.expiresOn',
  'ii.lotNumber',
  'itfs.name as inTransitFromSiteName',
  'ii.inTransitFromSiteId',
]

// Select for inventory grouped by site and consumable
const INVENTORY_ITEM_SELECT_LIST_FIELDS = [
  ...INVENTORY_COMMON_FIELDS,
  knex.raw('SUM(ii.quantityOnHand)'),
]

// Select for inventory split by lot
const INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS = [
  knex.raw(
    "CONCAT(c.id, '-', s.id, '-', ii.expiresOn,'-', ifnull(ii.lotNumber,''),'-', ifnull(ii.inTransitFromSiteId,'')) as id"
  ),
  ...INVENTORY_ITEM_SELECT.filter(
    field => field !== 'ii.id' && field !== 'ii.quantityOnHand'
  ),
  knex.raw('SUM(ii.quantityOnHand) AS quantityOnHand'),
]

const INVENTORY_ITEM_SORT_FIELDS = {
  consumableName: 'c.name',
  manufacturer: 'c.manufacturer',
  siteName: 's.name',
  inTransitFromSiteName: 'itfs.name',
  countryName: 'co.name',
  stateName: 'st.name',
  lgaName: 'l.name',
  quantityOnHand: 'ii.quantityOnHand',
  expiresOn: 'ii.expiresOn',
  lotNumber: 'ii.lotNumber',
  stockLeft: 'stock.stockLeft',
  dailyConsumptionRate: 'ficr.rate',
}

const INVENTORY_ITEM_FILTER_FIELDS = {
  countryId: 'g.countryId',
  stateId: 'g.stateId',
  lgaId: 'g.lgaId',
  consumableId: 'c.id',
  consumableExternalId: 'c.externalId',
  siteName: 's.name',
  siteId: 's.id',
  expiresOn: 'ii.expiresOn',
  lotNumber: 'ii.lotNumber',
}

const STOCK_LEFT_FILTER_FIELDS = {
  stockLeft: (queryBuilder, filterValue) => {
    queryBuilder.where(builder => {
      builder.whereNotNull(`stock.${filterValue}`)
      builder.where(`stock.${filterValue}`, '<>', 0)
    })
  },
}
const SUM_STOCK_LEFT_FILTER_FIELDS = {
  hasStock: queryBuilder => queryBuilder.havingRaw('quantityOnHand > 0'),
}

const INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES = { geography: 'g', site: 's' }

const SUPPLY_IN_STOCK_FIELDS = [
  'consumableId',
  'consumableName',
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NOT NULL AND daysUnexpired = 0 THEN true ELSE null END) as outOfStock'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NOT NULL AND daysUnexpired BETWEEN 1 and 14 THEN true ELSE null END) as upTo14'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NOT NULL AND daysUnexpired BETWEEN 15 and 30 THEN true ELSE null END) as upTo30'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NOT NULL AND daysUnexpired BETWEEN 31 and 90 THEN true ELSE null END) as upTo90'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NOT NULL AND daysUnexpired BETWEEN 91 and 180 THEN true ELSE null END) as upTo180'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NOT NULL AND daysUnexpired > 180 THEN true ELSE null END) as moreThan180'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NULL AND quantityOnHand IS NULL THEN true ELSE null END) as notRecorded'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysUnexpired IS NULL AND quantityOnHand IS NOT NULL THEN true ELSE null END) as noConsumption'
  ),
]

async function consumeInventoryForResult(
  resultId,
  assayId,
  siteId,
  consumablesInResultData,
  partnerId,
  testStartedOn,
  testEndedOn,
  knex
) {
  const now = new Date()
  const assayConsumables = await selectAssayConsumables(
    knex,
    { partner: { id: partnerId } },
    assayId
  )

  const { id: testRunConsumableReasonId } = await findConsumableReason(
    'Test Conducted'
  )

  await Promise.all(
    _.map(assayConsumables, async assayConsumable => {
      const existingInventoryLog = await knex('InventoryLog as il')
        .join('InventoryItem as ii', 'il.inventoryItemId', 'ii.id')
        .where({
          'il.resultId': resultId,
          'ii.consumableId': assayConsumable.consumableId,
        })
        .first('ii.id')
      // Don't double deduct inventory for the same result
      if (_.isEmpty(existingInventoryLog)) {
        // Find Inventory on hand where lot number and expiry date match
        const matchingInventoryItems = await findOrCreateMatchingInventoryItems(
          knex,
          siteId,
          assayConsumable,
          consumablesInResultData,
          now
        )
        const testedOn = testStartedOn || testEndedOn

        // always try to find match whether we have consumables or not
        // If we have multiple, find best match for each one.
        const matchingConsumables =
          consumablesInResultData.length > 0 ? consumablesInResultData : [null]
        for (const matchingConsumable of matchingConsumables) {
          /* eslint-disable no-await-in-loop */
          const matchingInventoryOnHand =
            findInventoryItemMatchingConsumableInResultData(
              matchingConsumable,
              matchingInventoryItems,
              testedOn,
              now
            )

          // Log change
          await logInventoryChange({
            knex,
            inventoryItemId: matchingInventoryOnHand.id,
            consumableId: assayConsumable.consumableId,
            siteId,
            consumableReasonId: testRunConsumableReasonId,
            resultId,
            lotNumber: matchingInventoryOnHand.lotNumber,
            expiresOn: matchingInventoryOnHand.expiresOn,
            quantity: assayConsumable.quantity,
            operation: 'result',
            adjustedFrom: testStartedOn,
            adjustedTo: testEndedOn,
            createdOn: now,
          })

          const inventoryItemUpdates = {}

          // Update quantity on hand, but result completed after
          // item was updated, to avoid double counting.
          // Do not bump updatedOn here because of the double count check
          if (matchingInventoryOnHand.updatedOn < (testedOn || now)) {
            inventoryItemUpdates.quantityOnHand = knex.raw(
              `GREATEST(quantityOnHand - ${assayConsumable.quantity}, 0)`
            )
          }

          // if we had an exact match on consumable date, and we don't have
          // a lot number for inventory item, but we do for matching consumable,
          // copy it over
          if (
            matchingConsumable != null &&
            matchingInventoryOnHand.lotNumber == null &&
            matchingConsumable.lot != null &&
            matchingInventoryOnHand.expiresOn != null &&
            _.isEqual(
              matchingInventoryOnHand.expiresOn,
              parseDateOrDefault(matchingConsumable.expirationDate)
            )
          ) {
            inventoryItemUpdates.lotNumber = matchingConsumable.lot
          }

          if (!_.isEmpty(inventoryItemUpdates)) {
            await updateInventoryItem(
              knex,
              matchingInventoryOnHand.id,
              inventoryItemUpdates
            )
          }

          // TODO ASP-811 do not use same inventory item for next consumable
          // matchingInventoryItems = _.reject(matchingInventoryItems => {
          //  matchingInventoryItemOnHand.id
          // })
        }
      }
    })
  )
}

async function findOrCreateMatchingInventoryItems(
  knex,
  siteId,
  assayConsumable,
  consumablesInResultData,
  now
) {
  const { consumableId } = assayConsumable
  const existingItems = await knex('InventoryItem')
    .where({ siteId, consumableId })
    .whereNull('inTransitFromSiteId')
    // Order by expiresOn asc nulls last, createdOn desc
    .orderByRaw('expiresOn is null')
    .orderBy('expiresOn', 'asc')
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .select()
  if (existingItems.length > 0) {
    return existingItems
  }

  // TODO ASP-811 should create a new item for each consumable in result data
  // should always have at least consumableInResultData.length items
  // We can likely do this by moving the Or Create prior to the match function
  // if candidate items are empty!
  const lotNumberInResultData = _.get(consumablesInResultData, '[0].lot')
  const expirationDateInResultData = getDateOrDefault(
    consumablesInResultData,
    '[0].expirationDate'
  )
  const newInventoryItemId = await upsertInventoryItem({
    knex,
    consumableId,
    siteId,
    lotNumber: lotNumberInResultData,
    expiresOn: expirationDateInResultData || undefined,
    quantity: 0,
    now,
  })

  const newItem = await knex('InventoryItem')
    .where({ id: newInventoryItemId })
    .first()
  return [newItem]
}

function findInventoryItemMatchingConsumableInResultData(
  consumable,
  inventoryItems,
  testedOn,
  now
) {
  if (inventoryItems.length === 0) {
    throw new Error('We should always have at least one candidate item.')
  }

  // Normalize input data for comparisons below
  const consumableExpiresOn =
    consumable == null ? null : consumable.expirationDate
  const consumableLot = consumable == null ? null : consumable.lot

  let hasItemExpiresOn = false
  let hasItemLot = false
  const items = _.map(inventoryItems, item => {
    const normalizedItem = {
      inventoryItem: item,
      expiresOn: item.expiresOn,
      lot: item.lotNumber ? item.lotNumber : null,
    }
    hasItemExpiresOn = hasItemExpiresOn || normalizedItem.expiresOn != null
    hasItemLot = hasItemLot || normalizedItem.lot != null
    return normalizedItem
  })

  if (consumable != null) {
    // Exact match of expire on and lot number
    if (
      hasItemExpiresOn &&
      hasItemLot &&
      consumableExpiresOn != null &&
      consumableLot != null
    ) {
      for (const item of items) {
        if (item.expiresOn == null) {
          break // Ordered by expiresOn, nulls last
        }
        const matchExpiresAndLotNumber =
          item.lot != null &&
          _.isEqual(consumableExpiresOn, item.expiresOn) &&
          _.isEqual(consumableLot, item.lot)
        if (matchExpiresAndLotNumber) {
          return item.inventoryItem
        }
      }
    }

    // Exact match of expiration date
    if (hasItemExpiresOn && consumableExpiresOn != null) {
      for (const item of items) {
        if (item.expiresOn == null) {
          break
        }

        const matchExpires = _.isEqual(consumableExpiresOn, item.expiresOn)
        if (matchExpires) {
          return item.inventoryItem
        }
      }
    }

    // Exact match of lot number
    if (hasItemLot && consumableLot != null) {
      for (const item of items) {
        const matchLot = item.lot != null && _.isEqual(consumableLot, item.lot)
        if (matchLot) {
          return item.inventoryItem
        }
      }
    }

    // Closest expiration date
    if (hasItemExpiresOn && consumableExpiresOn != null) {
      let bestItemMatch = null
      let bestItemAbsDiff = null
      for (const item of items) {
        if (item.expiresOn == null) {
          // ordered by expiresOn null last, so we have no more to check
          break
        }
        const currentDiff =
          item.expiresOn.getTime() - consumableExpiresOn.getTime()
        const currentAbsDiff = Math.abs(currentDiff)
        if (bestItemAbsDiff == null || currentAbsDiff < bestItemAbsDiff) {
          // if we don't have a current best, or abs diff is smaller,
          // then this is the best so far
          bestItemMatch = item
          bestItemAbsDiff = currentAbsDiff
        }
        if (currentDiff >= 0) {
          // we've crossed threshold for this consumable since we are
          // ordered by item expiresOn. The best match is either this
          // or previous item, depending on absolate value
          break
        }
      }
      if (bestItemMatch != null) {
        return bestItemMatch.inventoryItem
      }
    }
  }

  // Find Least recent inventory item that expires after test started
  // -or- most recently created item with null expires on
  if (hasItemExpiresOn) {
    const itemCutoffDate = testedOn || now
    for (const item of items) {
      if (item.expiresOn == null) {
        // most recently created item with null expires on
        // ordered by nulls last, so will prefer next check
        return item.inventoryItem
      }
      const itemExpireAfterTest = item.expiresOn >= itemCutoffDate
      if (itemExpireAfterTest) {
        return item.inventoryItem
      }
    }
  }

  //  If all else fails, use first match, due to order of query, and
  //  previous checks, this is the least recent createdOn
  //  Note we should always have at least one item since we create
  //  if does not exist per AssayConsumable
  return items[0].inventoryItem
}

function filteredInventoryItemsBase(request, dataConstraints) {
  const supplyInStockBase = getSupplyInStockBySiteAndConsumableBase(
    request,
    dataConstraints
  )

  const inventoryItemsQuery = query('Search Inventory Items')
    .from(supplyInStockBase.as('stock'))
    .innerJoin('Site as s', 'stock.siteId', 's.id')
    .innerJoin('Consumable as c', 'stock.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .leftOuterJoin('FactInventoryConsumptionRate as ficr', builder => {
      builder
        .on('ficr.siteId', 's.id')
        .andOn('ficr.consumableId', 'c.id')
        .andOn('ficr.days', 1)
    })
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      hasStock: knex.raw('ii.quantityOnHand <> 0'),
      ...STOCK_LEFT_FILTER_FIELDS,
    })
    .modify(
      addConstraints,
      dataConstraints,
      INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES
    )

  return inventoryItemsQuery
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
    .modify(
      addConstraints,
      dataConstraints,
      INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES
    )
    .groupBy([
      knex.raw(
        `CONCAT(c.id, '-', s.id, '-', ii.expiresOn,'-', ifnull(ii.lotNumber,''),'-', ifnull(ii.inTransitFromSiteId,''))`
      ),
      's.name',
      'ii.expiresOn',
      'ii.lotNumber',
      'ii.inTransitFromSiteId',
    ])
    .select(INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS)

  return inventoryItemsQuery
}

function getInventoryItemsRaw() {
  const fldExpiresOn = `DATE_FORMAT(IFNULL(ii.expiresOn, NOW()), '%Y-%m-%d')`
  const fldQuantity = `CAST( IFNULL(ii.quantityOnHand, 0) AS CHAR )`
  const itemRaw = `CONCAT(
    '{ "expiresOn": "', ${fldExpiresOn}, '", "quantityOnHand": "', ${fldQuantity}, '" }'
  )`

  return `CONCAT(
    '[',
      GROUP_CONCAT(${itemRaw} SEPARATOR ','),
    ']'
  )`
}

function getInventorySites(constraints, request) {
  const inventoryItemsRaw = getInventoryItemsRaw()

  return query('Search Inventory Sites')
    .from('Site as s')
    .innerJoin('Consumable as c')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('FactInventoryConsumptionRate as ficr', builder => {
      builder
        .on('s.id', 'ficr.siteId')
        .andOn('c.id', 'ficr.consumableId')
        .andOn(knex.raw('ficr.days = 1'))
    })
    .leftJoin('InventoryItem as ii', builder => {
      builder
        .on('s.id', 'ii.siteId')
        .andOn('c.id', 'ii.consumableId')
        .andOn(knex.raw('ii.inTransitFromSiteId IS NULL'))
        // we are interested in unexpired yet as of today
        .andOn(knex.raw('ii.expiresOn >= DATE(NOW())'))
    })
    .leftJoin('InventoryItem as ii_transfer', builder => {
      builder
        .on('s.id', 'ii_transfer.siteId')
        .andOn('c.id', 'ii_transfer.consumableId')
        .andOn(knex.raw('ii_transfer.inTransitFromSiteId IS NOT NULL'))
    })
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      ...SUM_STOCK_LEFT_FILTER_FIELDS,
    })
    .modify(builder => {
      if (request.query.daysStockLeft === 'noConsumption')
        builder.where('ficr.rate', 0).orWhereNull('ficr.rate')
      else if (request.query.daysStockLeft === 'notRecorded')
        builder.whereNull('ii.id')
    })
    .modify(addConstraints, constraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)
    .groupBy(['s.id', 'c.id', 'ficr.days'])
    .select([
      knex.raw("CONCAT(c.id, '-', s.id) as id"),
      'c.id as consumableId',
      'c.name as consumableName',
      'c.manufacturer',
      'c.canExpire',
      'u.shortName as unitShortName',
      's.id as siteId',
      's.name as siteName',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'co.name as countryName',
      'st.name as stateName',
      'l.name as lgaName',
      'ficr.rate as dailyConsumptionRate',
      knex.raw('SUM(ii.quantityOnHand) as quantityOnHand'),
      knex.raw('COUNT(ii_transfer.id) as pendingTransfers'),
      knex.raw(
        'SUM(ii_transfer.quantityOnHand) as pendingTransfersQuantityOnHand'
      ),
      knex.raw(
        `CASE WHEN IFNULL(ficr.rate, 0) = 0
          THEN null
          ELSE GetDaysStockLeft(ficr.rate, ${inventoryItemsRaw})
        END as daysStockLeft`
      ),
      knex.raw(
        `CASE WHEN IFNULL(ficr.rate, 0) = 0
          THEN null
          ELSE GetProjectedWaste(ficr.rate, ${inventoryItemsRaw})
        END as projectedWaste`
      ),
    ])
}

async function listInventory(request) {
  const { auth, query } = request
  const { breakOutByLot } = query

  const dataConstraints = await getConstraints(auth.credentials)

  let data
  let total

  if (breakOutByLot) {
    ;({ total, data } = await listInventoryByLot(request, dataConstraints))
  } else {
    ;({ total, data } = await listInventoryBySiteAndConsumable(
      request,
      dataConstraints
    ))
  }

  return { ok: true, total, length: data.length, data }
}

async function listInventoryByLot(request, dataConstraints) {
  const inventoryQuery = getInventoryLots(request, dataConstraints)

  const getCount = knex
    .from(inventoryQuery.clone().as('q'))
    .count({ count: 'q.id' })
    .first()

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
    .modify(
      sortPageParams,
      requestQuery,
      INVENTORY_ITEM_SORT_FIELDS.siteName,
      INVENTORY_ITEM_SORT_FIELDS
    )

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { total, data }
}

async function listInventoryBySiteAndConsumable(request, dataConstraints) {
  const { query } = request
  const range = getDaysStockLeftRanges(query.daysStockLeft)

  let inventoryQuery = getInventorySites(dataConstraints, request)

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
  inventoryQuery = inventoryQuery.modify(
    sortPageParams,
    request.query,
    'siteName'
  )

  const inventorySites = await inventoryQuery

  return { data: inventorySites, total }
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

const siteFields = [
  'siteId',
  'siteName',
  'countryId',
  'stateId',
  'lgaId',
  'countryName',
  'stateName',
  'lgaName',
]
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

  const inventoryItemsQuery = filteredInventoryItemsBase(
    request,
    dataConstraints
  ).modify(
    sortParams,
    requestQuery,
    INVENTORY_ITEM_SORT_FIELDS.siteName,
    INVENTORY_ITEM_SORT_FIELDS
  )

  const getSiteCount = inventoryItemsQuery
    .clone()
    .countDistinct('s.id as count')
    .first()

  const getSiteIds = inventoryItemsQuery
    .clone()
    .groupBy('s.id')
    .select('s.id as siteId')
    .modify(pageParams, requestQuery)

  const [{ count: total }, sitesData] = await Promise.all([
    getSiteCount,
    getSiteIds,
  ])
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
  } else
    fieldsToSelect = INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS.filter(
      x => x !== 'ii.id'
    )

  const inventoryItems = await inventoryItemsQuery
    .whereIn('s.id', siteIdsOnPage)
    .select([
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
      inventoryItems: _.map(siteItems, siteItem =>
        _.pick(siteItem, inventoryItemFields)
      ),
    }
  })

  return {
    ok: true,
    total,
    length: sitesWithConsumables.length,
    data: sitesWithConsumables,
  }
}

function getSupplyInStockBySiteAndConsumableBase(request, dataConstraints) {
  // group by siteId and consumableId, and return different counts
  const baseWithCalculatedFields =
    getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(
      request,
      dataConstraints
    )
  const supplyInStockBase = knex
    .from(baseWithCalculatedFields.as('t2'))
    .groupBy(['consumableId', 'siteId'])
    .select([
      ...SUPPLY_IN_STOCK_FIELDS,
      knex.raw('MAX(daysUnexpired) as stockLeft'),
      'siteId',
    ])
  return supplyInStockBase
}

/**
 * Returns base knex query (no async/await!) with prepared/precalculated data for
 * inventories
 * @param {*} request
 * @param {*} dataConstraints
 */
function getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(
  request,
  dataConstraints
) {
  const baseInventoryItemsBySiteGeography = query(
    'Join Consumable with Inventory Items, Site Details, and Geography Details'
  )
    .from('Consumable as c')
    .innerJoin('InventoryItem as ii', 'c.id', 'ii.consumableId')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('ConsumableAssay as cona', 'cona.consumableId', 'c.id')
    .innerJoin('Assay as asa', 'asa.id', 'cona.assayId')
    .innerJoin('DeviceType as dt', 'dt.id', 'asa.deviceTypeId')
    .innerJoin(
      function () {
        this.select('d.*')
          .from('Device as d')
          .innerJoin('Site as si', 'si.id', 'd.siteId')
          .innerJoin('DeviceType as det', 'det.id', 'd.deviceTypeId')
          .groupBy('d.siteId', 'd.deviceTypeId')
          .as('DistTable')
      },
      function () {
        this.on('DistTable.siteId', 's.id').andOn(
          'DistTable.deviceTypeId',
          'dt.id'
        )
      }
    )
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Country as co', 'g.countryId', 'co.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    // dailyRate
    .leftOuterJoin('FactInventoryConsumptionRate as rate1', function () {
      this.on('rate1.siteId', 's.id')
        .andOn('rate1.consumableId', 'c.id')
        .andOn('rate1.days', 1)
    })
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      hasStock: knex.raw('ii.quantityOnHand <> 0'),
    })
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(addConstraints, dataConstraints, {
      ...INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
      device: 'DistTable',
    })
    .select(
      'c.id as consumableId',
      'c.name as consumableName',
      's.id as siteId',
      'ii.quantityOnHand',
      knex.raw(
        'CASE WHEN ii.quantityOnHand IS NOT NULL THEN ii.expiresOn ELSE NULL END as expirationDate'
      ),
      // expiresInDays - when inventory expires, in days
      knex.raw(`
        CASE
        WHEN ii.quantityOnHand IS NULL THEN NULL
        ELSE CAST(GREATEST(DATEDIFF(ii.expiresOn, NOW()), 0) AS SIGNED INTEGER)
        END AS expiresInDays
      `),
      // daily consumption rate
      knex.raw('CAST(rate1.rate AS DECIMAL(10, 6)) AS dailyRate'),
      // lastsInDays - how long the 'quantityOnHand' lasts, in days
      knex.raw(`
        CASE
        WHEN IFNULL(ii.quantityOnHand,0) > 0 and IFNULL(rate1.rate, 0) > 0 THEN CAST(ii.quantityOnHand / rate1.rate AS SIGNED)
        ELSE NULL
        END AS lastsInDays
      `)
    )
    .union([
      query('Join Consumable with Sites which does not have inventories')
        .from('Consumable as c')
        .join('Site as s')
        .innerJoin('ConsumableAssay as cona', 'cona.consumableId', 'c.id')
        .innerJoin('Assay as asa', 'asa.id', 'cona.assayId')
        .innerJoin('DeviceType as dt', 'dt.id', 'asa.deviceTypeId')
        .innerJoin(
          function () {
            this.select('d.*')
              .from('Device as d')
              .innerJoin('Site as si', 'si.id', 'd.siteId')
              .innerJoin('DeviceType as det', 'det.id', 'd.deviceTypeId')
              .groupBy('d.siteId', 'd.deviceTypeId')
              .as('DistTable')
          },
          function () {
            this.on('DistTable.siteId', 's.id').andOn(
              'DistTable.deviceTypeId',
              'dt.id'
            )
          }
        )
        .leftOuterJoin('InventoryItem as ii', function () {
          this.on('c.id', 'ii.consumableId').andOn('s.id', 'ii.siteId')
        })
        .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
        .leftOuterJoin('Country as co', 'g.countryId', 'co.id')
        .leftOuterJoin('State as st', 'g.stateId', 'st.id')
        .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
        .whereNull('ii.id') // means site doesn't have inventory items
        .modify(filterParams, request.query, {
          ...INVENTORY_ITEM_FILTER_FIELDS,
          hasStock: knex.raw('ii.quantityOnHand <> 0'),
        })
        .modify(addConstraints, dataConstraints, {
          ...INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
          assay: 'asa',
          device: 'DistTable',
        })
        .select(
          'c.id as consumableId',
          'c.name as consumableName',
          's.id as siteId',
          knex.raw('null as quantityOnHand'),
          knex.raw('null as expirationDate'),
          knex.raw('null as expiresInDays'),
          knex.raw('null as dailyRate'),
          knex.raw('null as lastsInDays')
        ),
    ])
  // -----------------
  // add couple of calculated fields - daysUnexpired, wasted
  const baseWithCalculatedFields = knex
    .from(baseInventoryItemsBySiteGeography.as('t1'))
    .select(
      't1.*',
      knex.raw(`
      CASE
        WHEN quantityOnHand IS NULL THEN NULL
        WHEN quantityOnHand <= 0 THEN 0
        WHEN expiresInDays > lastsInDays OR expirationDate IS NULL OR dailyRate IS NULL
          THEN lastsInDays
        ELSE expiresInDays
      END AS daysUnexpired
      `),
      knex.raw(`
      CASE
        WHEN quantityOnHand IS NULL THEN NULL
        WHEN quantityOnHand <= 0 THEN 0
        WHEN expiresInDays < lastsInDays AND expirationDate IS NOT NULL
          THEN
            CASE
              WHEN expirationDate > NOW() THEN CAST(dailyRate * (lastsInDays - expiresInDays) AS SIGNED)
              ELSE quantityOnHand
            END
        ELSE 0
      END AS wasted
      `)
    )
  return baseWithCalculatedFields
}

async function getDaysByLocation(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const baseWithCalculatedFields =
    getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(
      request,
      dataConstraints
    )

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

async function findInventoryItem(
  siteId,
  consumableId,
  expiresOn,
  lotNumber,
  inTransitFromSiteId
) {
  const matchingInventoryItemsQuery = query('Find Inventory Item')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .where({
      'ii.siteId': siteId,
      'ii.consumableId': consumableId,
    })
  if (expiresOn) {
    matchingInventoryItemsQuery.where('ii.expiresOn', expiresOn)
  } else {
    matchingInventoryItemsQuery.whereNull('ii.expiresOn')
  }

  if (!_.isEmpty(lotNumber)) {
    matchingInventoryItemsQuery.where('ii.lotNumber', lotNumber)
  } else {
    matchingInventoryItemsQuery.where(builder =>
      builder.whereNull('ii.lotNumber').orWhere('ii.lotNumber', '')
    )
  }

  if (inTransitFromSiteId) {
    matchingInventoryItemsQuery.where(
      'ii.inTransitFromSiteId',
      inTransitFromSiteId
    )
  } else {
    matchingInventoryItemsQuery.whereNull('ii.inTransitFromSiteId')
  }

  const matchingInventoryItems = await matchingInventoryItemsQuery.select(
    INVENTORY_ITEM_SELECT
  )
  return _.head(matchingInventoryItems)
}

function getInventoryItem(inventoryItemId) {
  return query('Get Inventory Item')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .where('ii.id', inventoryItemId)
    .first(INVENTORY_ITEM_SELECT)
}

async function getInventoryItems(inventoryItemIds) {
  if (_.isEmpty(inventoryItemIds)) {
    return Promise.resolve([])
  }
  return query('Get Inventory Item')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .whereIn('ii.id', inventoryItemIds)
    .select(INVENTORY_ITEM_SELECT)
}

async function addInventory(request) {
  const {
    auth,
    payload: {
      toSiteId,
      consumableId,
      expiresOn,
      lotNumber,
      quantity,
      reasonId,
      dateAdjusted,
      notes,
    },
  } = request

  // get MQ context and bind few action creators
  const messageContext = request.plugins.messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
    resolveIssues,
    escalateIssues,
  })

  const dataConstraints = await getConstraints(auth.credentials)

  const toSite = await getSite(toSiteId, dataConstraints)

  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const inventoryItemId = await increaseInventory({
    siteId: toSite.id,
    consumableId,
    expiresOn,
    lotNumber,
    quantity,
    reasonId,
    dateAdjustedFrom: dateAdjusted,
    notes,
    now,
    operation: 'add',
    userId: currentlyLoggedInUser.id,
    messageContext,
  })

  return {
    ok: true,
    data: await getInventoryItem(inventoryItemId),
  }
}

async function removeInventory(request) {
  const {
    auth,
    payload: {
      fromSiteId,
      consumableId,
      expiresOn,
      lotNumber,
      quantity,
      reasonId,
      dateAdjusted,
      dateAdjustedFrom,
      dateAdjustedTo,
      notes,
    },
  } = request

  // get MQ context and bind few action creators
  const messageContext = request.plugins.messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
    resolveIssues,
    escalateIssues,
  })

  const dataConstraints = await getConstraints(auth.credentials)

  const fromSite = await getSite(fromSiteId, dataConstraints)

  if (!fromSite) {
    return Boom.forbidden(
      'You are not permitted to remove inventory from this site'
    )
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const inventoryItemId = await decreaseInventory({
    siteId: fromSite.id,
    consumableId,
    expiresOn,
    lotNumber,
    quantity,
    reasonId,
    dateAdjustedFrom: dateAdjusted || dateAdjustedFrom,
    dateAdjustedTo,
    notes,
    now,
    operation: 'remove',
    userId: currentlyLoggedInUser.id,
    messageContext,
  })

  return {
    ok: true,
    data: await getInventoryItem(inventoryItemId),
  }
}

async function transferInventory(request) {
  const {
    auth,
    payload: {
      fromSiteId,
      toSiteId,
      consumableId,
      expiresOn,
      lotNumber,
      quantity,
      dateAdjusted,
      notes,
    },
  } = request

  // get MQ context and bind few action creators
  const messageContext = request.plugins.messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
    resolveIssues,
    escalateIssues,
  })

  const dataConstraints = await getConstraints(auth.credentials)

  const toSite = await getSite(toSiteId, dataConstraints)

  if (!toSite) {
    return Boom.forbidden(
      'You are not permitted to transfer inventory to this site'
    )
  }

  const fromSite = await getSite(fromSiteId, dataConstraints)

  if (!fromSite) {
    return Boom.forbidden(
      'You are not permitted to transfer inventory from this site'
    )
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()

  const sourceInventoryItem = await findInventoryItem(
    fromSiteId,
    consumableId,
    expiresOn,
    lotNumber
  )

  const destinationInventoryItem = await findInventoryItem(
    toSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    fromSiteId
  )
  let destinationInventoryItemId = -1
  let sourceInventoryItemId = -1
  await transact(async knex => {
    destinationInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItem: destinationInventoryItem,
      consumableId,
      siteId: toSiteId,
      lotNumber,
      expiresOn,
      quantity,
      now,
      userId: currentlyLoggedInUser.id,
      inTransitFromSiteId: fromSiteId,
    })

    const { id: transferSentConsumableReasonId } = await findConsumableReason(
      'Transfer Sent'
    )

    sourceInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItem: sourceInventoryItem,
      consumableId,
      siteId: fromSiteId,
      lotNumber,
      expiresOn,
      quantity: -quantity,
      now,
      userId: currentlyLoggedInUser.id,
    })

    await logInventoryChange({
      knex,
      inventoryItemId: sourceInventoryItemId,
      consumableId,
      siteId: fromSiteId,
      consumableReasonId: transferSentConsumableReasonId,
      lotNumber,
      expiresOn,
      quantity,
      operation: 'transfer from',
      notes,
      adjustedFrom: dateAdjusted,
      createdOn: now,
      createdBy: currentlyLoggedInUser.id,
    })

    // check both sites for Stockout/StockExpiring issues
    const props = {
      knex,
      consumableId,
      now,
      messageContext,
    }
    await checkOpenedStockIssues({ ...props, siteId: fromSiteId })
    await checkOpenedStockIssues({ ...props, siteId: toSiteId })
  })

  return {
    ok: true,
    data: {
      existingInventoryItem: await getInventoryItem(sourceInventoryItemId),
      newInventoryItem: await getInventoryItem(destinationInventoryItemId),
    },
  }
}

async function receiveInventory(request) {
  const {
    auth,
    payload: {
      fromSiteId,
      toSiteId,
      consumableId,
      expiresOn,
      lotNumber,
      quantity,
      dateAdjusted,
      notes,
    },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const toSite = await getSite(toSiteId, dataConstraints)

  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const sourceInventoryItem = await findInventoryItem(
    toSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    fromSiteId
  )
  if (_.isEmpty(sourceInventoryItem)) {
    return Boom.notFound('Could not find source item')
  }
  const destinationInventoryItem = await findInventoryItem(
    toSiteId,
    consumableId,
    expiresOn,
    lotNumber
  )
  let destinationInventoryItemId = -1
  await transact(async knex => {
    destinationInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItem: destinationInventoryItem,
      consumableId,
      siteId: toSiteId,
      lotNumber,
      expiresOn,
      quantity,
      now,
      userId: currentlyLoggedInUser.id,
    })

    const { id: transferReceivedConsumableReasonId } =
      await findConsumableReason('Transfer Received')

    await logInventoryChange({
      knex,
      inventoryItemId: destinationInventoryItemId,
      consumableId,
      siteId: toSiteId,
      consumableReasonId: transferReceivedConsumableReasonId,
      lotNumber,
      expiresOn,
      quantity,
      operation: 'receive to',
      notes,
      adjustedFrom: dateAdjusted,
      createdOn: now,
      createdBy: currentlyLoggedInUser.id,
    })

    await knex('InventoryItem').where('id', sourceInventoryItem.id).delete()
  })

  return {
    ok: true,
    data: await getInventoryItem(destinationInventoryItemId),
  }
}

async function selectInventoryStockAtSite(siteId, consumableId) {
  return knex('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .where({ consumableId, siteId })
    .first(knex.raw('coalesce(sum(ii.quantityOnHand),0) as totalInStock'))
}

async function decreaseInventory(inventoryAjustment) {
  const inventoryItemId = await changeInventoryQuantity(
    _.merge(inventoryAjustment, { quantity: -inventoryAjustment.quantity })
  )
  return inventoryItemId
}

async function increaseInventory(inventoryAjustment) {
  const inventoryItemId = await changeInventoryQuantity(inventoryAjustment)
  return inventoryItemId
}

async function changeInventoryQuantity({
  siteId,
  consumableId,
  expiresOn,
  lotNumber,
  quantity,
  quantityOnHand,
  reasonId,
  dateAdjustedFrom,
  dateAdjustedTo,
  notes,
  now,
  operation,
  userId,
  messageContext,
}) {
  const inventoryItem = await findInventoryItem(
    siteId,
    consumableId,
    expiresOn,
    lotNumber
  )
  let inventoryItemId = -1
  await transact(async knex => {
    inventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItem,
      consumableId,
      siteId,
      lotNumber,
      expiresOn,
      quantity,
      quantityOnHand,
      now,
      userId,
    })

    await logInventoryChange({
      knex,
      inventoryItemId,
      consumableId,
      siteId,
      lotNumber,
      expiresOn,
      quantity: Math.abs(quantity),
      consumableReasonId: reasonId,
      operation,
      notes,
      adjustedFrom: dateAdjustedFrom,
      adjustedTo: dateAdjustedTo,
      createdOn: now,
      createdBy: userId,
    })

    await checkOpenedStockIssues({
      knex,
      siteId,
      consumableId,
      now,
      messageContext,
    })
  })

  return inventoryItemId
}

async function checkOpenedStockIssues({
  knex,
  siteId,
  consumableId,
  now,
  messageContext,
}) {
  // same query as in onFactCheckInventoryStock() in /src/inventory/service.js, but with additional 'where' for ii.siteId and ii.consumableId
  // this is just for getting dueDaysInventoryStockout and dueDaysInventoryStockExpiring values
  const [site] = await knex('InventoryItem as ii')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .where('ii.siteId', siteId)
    .where('ii.consumableId', consumableId)
    .where(function () {
      this.whereNull('ii.expiresOn') // if is null
        .orWhere('ii.expiresOn', '>', now) // or unexpired
    })
    .groupBy('ii.siteId', 'ii.consumableId')
    .select(
      'ii.siteId',
      'ii.consumableId',
      knex.raw('MAX(p.dueDaysInventoryStockout) as dueDaysInventoryStockout'),
      knex.raw(
        'MAX(p.dueDaysInventoryStockExpiring) as dueDaysInventoryStockExpiring'
      )
    )
  // notice that 'rate' field in table FactInventoryConsumptionRate stores total number of
  // tests during corresponding 'days'. So for actual rate you should do rate/days, but
  // for days=1 use 'rate' as-is
  const { rate: dailyRate } = (await knex('FactInventoryConsumptionRate')
    .where({ siteId, consumableId, days: 1 })
    .first('rate')) || { rate: 0 }

  // 'dailyRate' should be always>0 if there is at least one result
  // 'site' may be undefinied if InventoryItem.expiresOn is less than today
  if (site && dailyRate > 0) {
    // try to resolve Stockout/StockExpiring issues, if any opened for this site/consumable

    // get MQ context and bind few action creators
    messageContext = messageContext.bindActionCreators({
      inventoryStockout,
      inventoryStockExpiring,
      resolveIssues,
      escalateIssues,
    })

    const props = {
      knex,
      siteId,
      consumableId,
      dailyRate,
      messageContext,
    }

    await checkStockoutIssues({
      dueDays: site.dueDaysInventoryStockout,
      ...props,
    })

    await checkStockExpiringIssues({
      dueDays: site.dueDaysInventoryStockExpiring,
      ...props,
    })
  }
}

async function checkStockoutIssues({
  knex,
  siteId,
  consumableId,
  dailyRate,
  dueDays,
  messageContext,
}) {
  // see if need to trigger issue - call same func as scheduler
  await auditInventoryStockout({
    knex,
    site: { siteId, consumableId },
    dailyRate,
    dueDays,
    trigger: messageContext.inventoryStockout,
    resolver: messageContext.resolveIssues,
    escalator: messageContext.escalateIssues,
  })
}

async function checkStockExpiringIssues({
  knex,
  siteId,
  consumableId,
  dailyRate,
  dueDays,
  messageContext,
}) {
  // see if need to trigger issue - call same func as scheduler
  await auditInventoryStockExpiring({
    knex,
    site: { siteId, consumableId },
    dailyRate,
    dueDays,
    trigger: messageContext.inventoryStockExpiring,
    resolver: messageContext.resolveIssues,
    escalator: messageContext.escalateIssues,
  })
}

async function logInventoryChange({
  knex,
  inventoryItemId,
  consumableId,
  siteId,
  consumableReasonId,
  resultId,
  lotNumber,
  expiresOn,
  quantity,
  operation,
  notes,
  adjustedFrom,
  adjustedTo,
  createdOn,
  createdBy,
}) {
  await knex('InventoryLog').insert({
    inventoryItemId,
    consumableId,
    siteId,
    consumableReasonId,
    resultId,
    lotNumber,
    expiresOn: expiresOn || null,
    quantity,
    operation,
    notes,
    adjustedFrom,
    adjustedTo,
    createdOn,
    createdBy,
  })
}

async function upsertInventoryItem({
  knex,
  inventoryItem,
  consumableId,
  siteId,
  lotNumber,
  expiresOn,
  quantity,
  quantityOnHand,
  now,
  userId,
  inTransitFromSiteId,
}) {
  let inventoryItemId = -1
  if (_.isEmpty(inventoryItem)) {
    ;[inventoryItemId] = await insertInventoryItem(knex, {
      consumableId,
      inTransitFromSiteId: inTransitFromSiteId || null,
      siteId,
      lotNumber,
      expiresOn,
      quantityOnHand: _.isUndefined(quantityOnHand) ? quantity : quantityOnHand,
      updatedOn: now,
      updatedBy: userId,
      createdOn: now,
      createdBy: userId,
    })
  } else {
    inventoryItemId = inventoryItem.id
    await updateInventoryItem(knex, inventoryItemId, {
      expiresOn,
      lotNumber,
      siteId,
      quantityOnHand: _.isUndefined(quantityOnHand)
        ? knex.raw(`quantityOnHand + (${quantity})`)
        : quantityOnHand,
      updatedOn: now,
      updatedBy: userId,
    })
  }
  return inventoryItemId
}

async function updateInventoryItem(knex, inventoryItemId, inventoryItemValues) {
  const updateValues = {}
  if (typeof inventoryItemValues.expiresOn !== 'undefined') {
    updateValues.expiresOn = inventoryItemValues.expiresOn
      ? parseDateOrDefault(inventoryItemValues.expiresOn)
      : null
  }
  if (typeof inventoryItemValues.lotNumber !== 'undefined') {
    updateValues.lotNumber = inventoryItemValues.lotNumber
  }
  if (typeof inventoryItemValues.siteId !== 'undefined') {
    updateValues.siteId = inventoryItemValues.siteId
  }
  if (typeof inventoryItemValues.quantityOnHand !== 'undefined') {
    updateValues.quantityOnHand = inventoryItemValues.quantityOnHand
  }
  updateValues.updatedOn = new Date()
  if (typeof inventoryItemValues.updatedBy !== 'undefined') {
    updateValues.updatedBy = inventoryItemValues.updatedBy
  }

  return knex('InventoryItem').where('id', inventoryItemId).update(updateValues)
}

async function insertInventoryItem(knex, inventoryItemValues) {
  const insertValues = {}
  if (typeof inventoryItemValues.consumableId !== 'undefined') {
    insertValues.consumableId = inventoryItemValues.consumableId
  }
  if (typeof inventoryItemValues.inTransitFromSiteId !== 'undefined') {
    insertValues.inTransitFromSiteId = inventoryItemValues.inTransitFromSiteId
  }
  if (typeof inventoryItemValues.siteId !== 'undefined') {
    insertValues.siteId = inventoryItemValues.siteId
  }
  if (typeof inventoryItemValues.lotNumber !== 'undefined') {
    insertValues.lotNumber = inventoryItemValues.lotNumber
  }
  if (typeof inventoryItemValues.expiresOn !== 'undefined') {
    insertValues.expiresOn = inventoryItemValues.expiresOn
      ? parseDateOrDefault(inventoryItemValues.expiresOn)
      : null
  }
  if (typeof inventoryItemValues.quantityOnHand !== 'undefined') {
    insertValues.quantityOnHand = inventoryItemValues.quantityOnHand
  }
  if (typeof inventoryItemValues.updatedOn !== 'undefined') {
    insertValues.updatedOn = inventoryItemValues.updatedOn
  }
  if (typeof inventoryItemValues.updatedBy !== 'undefined') {
    insertValues.updatedBy = inventoryItemValues.updatedBy
  }
  if (typeof inventoryItemValues.createdOn !== 'undefined') {
    insertValues.createdOn = inventoryItemValues.createdOn
  }
  if (typeof inventoryItemValues.createdBy !== 'undefined') {
    insertValues.createdBy = inventoryItemValues.createdBy
  }
  const newInventoryItem = await knex('InventoryItem').insert(insertValues)
  return newInventoryItem
}

module.exports = {
  getInventoryItems,
  listInventory,
  listInventoryGroupedBySite,
  consumeInventoryForResult,
  increaseInventory,
  decreaseInventory,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  selectInventoryStockAtSite,
  getDaysByLocation,
}
