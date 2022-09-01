const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')
const { parseDateOrDefault } = require('../shared/date')
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
const { selectAssayConsumables } = require('../consumable/assayConsumableService')
const { findConsumableReason } = require('../consumable/consumableService')
const { getUser } = require('../auth/service')
const { getSite } = require('../site/service')
const { resolveIssues, escalateIssues } = require('../issue/actions')
const { inventoryStockout, inventoryStockExpiring } = require('./actions')
const { auditInventoryStockout, auditInventoryStockExpiring } = require('../shared/utilsInventory')
const { querySelectors, getInventoryLogBaseQuery } = require('./query/index')
const { splitCsvWithTrim } = require('../shared/string')
const { findInventoryItem, getInventorySitesQuery } = require('./common/db')
const {
  INVENTORY_ITEM_SORT_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
  INVENTORY_ITEM_SELECT_LIST_FIELDS,
  INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS,
  INVENTORY_LOG_SORT_FIELDS,
  INVENTORY_ITEM_FILTER_FIELDS,
  SUPPLY_IN_STOCK_FIELDS,
  INVENTORY_ITEM_SELECT,
  STOCK_LEFT_FILTER_FIELDS,
} = require('./common/queryConstants')

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
  const assayConsumables = await selectAssayConsumables(knex, { partner: { id: partnerId } }, assayId)

  const { id: testRunConsumableReasonId } = await findConsumableReason('Test Conducted')

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
        const matchingInventoryItem = await findOrCreateMatchingInventoryItem(
          knex,
          siteId,
          assayConsumable,
          consumablesInResultData,
          now,
          assayConsumable.strategy
        )
        const testedOn = testStartedOn || testEndedOn

        // always try to find match whether we have consumables or not
        // If we have multiple, find best match for each one.
        const matchingConsumables = consumablesInResultData.length > 0 ? consumablesInResultData : [null]
        for (const matchingConsumable of matchingConsumables) {
          /* eslint-disable no-await-in-loop */
          const matchingInventoryOnHand = findInventoryItemMatchingConsumableInResultData(
            matchingConsumable,
            matchingInventoryItem,
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

          inventoryItemUpdates.quantityOnHand = knex.raw(`quantityOnHand - ${assayConsumable.quantity}`)

          await updateInventoryItem(knex, matchingInventoryOnHand.id, inventoryItemUpdates)
        }
      }
    })
  )
}

async function findOrCreateMatchingInventoryItem(
  knex,
  siteId,
  assayConsumable,
  consumablesInResultData,
  now,
  strategy
) {
  const { lot, expirationDate } = _.get(consumablesInResultData, '[0]') || {}

  const { consumableId } = assayConsumable
  const existingItem = await findInventoryItem(siteId, consumableId, expirationDate, lot, false)

  if (existingItem) {
    return existingItem
  }

  // TODO ASP-811 should create a new item for each consumable in result data
  // should always have at least consumableInResultData.length items
  // We can likely do this by moving the Or Create prior to the match function
  // if candidate items are empty!
  const lotNumberInResultData = strategy.indexOf('withLot') >= 0 ? _.get(consumablesInResultData, '[0].lot') : null

  const newInventoryItemId = await upsertInventoryItem({
    knex,
    consumableId,
    siteId,
    lotNumber: lotNumberInResultData,
    expiresOn: expirationDate || undefined,
    quantity: 0,
    now,
  })

  const newItem = await knex('InventoryItem').where({ id: newInventoryItemId }).first()
  return newItem
}

function findInventoryItemMatchingConsumableInResultData(consumable, inventoryItem, testedOn, now) {
  if (!inventoryItem) {
    throw new Error('We should always have at least one candidate item.')
  }

  // Normalize input data for comparisons below
  const consumableExpiresOn = consumable?.expirationDate
  const consumableLot = consumable?.lot

  let hasItemExpiresOn = false
  let hasItemLot = false
  const { expiresOn } = inventoryItem
  const lot = inventoryItem.lotNumber ? inventoryItem.lotNumber : null
  hasItemExpiresOn = hasItemExpiresOn || expiresOn != null
  hasItemLot = hasItemLot || lot != null

  if (consumable != null) {
    // Exact match of expire on and lot number
    if (hasItemExpiresOn && hasItemLot && consumableExpiresOn != null && consumableLot != null) {
      if (inventoryItem.expiresOn != null) {
        const matchExpiresAndLotNumber =
          inventoryItem.lot != null &&
          _.isEqual(consumableExpiresOn, inventoryItem.expiresOn) &&
          _.isEqual(consumableLot, inventoryItem.lot)
        if (matchExpiresAndLotNumber) {
          return inventoryItem
        }
      }
    }

    // Exact match of expiration date
    if (hasItemExpiresOn && consumableExpiresOn != null) {
      if (inventoryItem.expiresOn != null) {
        const matchExpires = _.isEqual(consumableExpiresOn, inventoryItem.expiresOn)
        if (matchExpires) {
          return inventoryItem
        }
      }
    }

    // Exact match of lot number
    if (hasItemLot && consumableLot != null) {
      const matchLot = inventoryItem.lot != null && _.isEqual(consumableLot, inventoryItem.lot)
      if (matchLot) {
        return inventoryItem
      }
    }

    // Closest expiration date
    if (hasItemExpiresOn && consumableExpiresOn != null) {
      let bestItemMatch = null
      let bestItemAbsDiff = null
      if (inventoryItem.expiresOn != null) {
        // ordered by expiresOn null last, so we have no more to check
        const currentDiff = inventoryItem.expiresOn.getTime() - consumableExpiresOn.getTime()
        const currentAbsDiff = Math.abs(currentDiff)
        if (bestItemAbsDiff == null || currentAbsDiff < bestItemAbsDiff) {
          // if we don't have a current best, or abs diff is smaller,
          // then this is the best so far
          bestItemMatch = inventoryItem
          bestItemAbsDiff = currentAbsDiff
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
    if (inventoryItem.expiresOn == null) {
      // most recently created item with null expires on
      // ordered by nulls last, so will prefer next check
      return inventoryItem
    }
    const itemExpireAfterTest = inventoryItem.expiresOn >= itemCutoffDate
    if (itemExpireAfterTest) {
      return inventoryItem
    }
  }

  //  If all else fails, use first match, due to order of query, and
  //  previous checks, this is the least recent createdOn
  //  Note we should always have at least one item since we create
  //  if does not exist per AssayConsumable
  return inventoryItem
}

function filteredInventoryItemsBase(request, dataConstraints) {
  const supplyInStockBase = getSupplyInStockBySiteAndConsumableBase(request, dataConstraints)

  const inventoryItemsQuery = query('Search Inventory Items')
    .from(supplyInStockBase.as('stock'))
    .innerJoin('Site as s', 'stock.siteId', 's.id')
    .innerJoin('Consumable as c', 'stock.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .leftOuterJoin('FactInventoryConsumptionRate as ficr', builder => {
      builder.on('ficr.siteId', 's.id').andOn('ficr.consumableId', 'c.id').andOn('ficr.days', 1)
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
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)

  return inventoryItemsQuery
}

async function listInventoryLog(request) {
  return listLog(request)
}

async function listLog(request, querySelector = querySelectors.INVENTORY_LOG_LIST) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const inventoryLogQuery = getInventoryLogBaseQuery(knex, dataConstraints)
    .modify(filterDateRangeParams, query, 'il.createdOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      consumableId: 'c.id',
      consumableExternalId: 'c.externalId',
      siteName: 's.name',
      siteId: 's.id',
    })
  const { total } = await inventoryLogQuery.clone().count('il.id as total').first()
  const data = await inventoryLogQuery
    .select(querySelector)
    .modify(sortPageParams, query, 'il.createdOn', INVENTORY_LOG_SORT_FIELDS)
  return { ok: true, total, length: data.length, data }
}

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

function getSupplyInStockBySiteAndConsumableBase(request, dataConstraints) {
  // group by siteId and consumableId, and return different counts
  const baseWithCalculatedFields = getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(request, dataConstraints)
  const supplyInStockBase = knex
    .from(baseWithCalculatedFields.as('t2'))
    .groupBy(['consumableId', 'siteId'])
    .select([...SUPPLY_IN_STOCK_FIELDS, knex.raw('MAX(daysUnexpired) as stockLeft'), 'siteId'])
  return supplyInStockBase
}

/**
 * Returns base knex query (no async/await!) with prepared/precalculated data for
 * inventories
 * @param {*} request
 * @param {*} dataConstraints
 */
function getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(request, dataConstraints) {
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
        this.on('DistTable.siteId', 's.id').andOn('DistTable.deviceTypeId', 'dt.id')
      }
    )
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Country as co', 'g.countryId', 'co.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    // dailyRate
    .leftOuterJoin('FactInventoryConsumptionRate as rate1', function () {
      this.on('rate1.siteId', 's.id').andOn('rate1.consumableId', 'c.id').andOn('rate1.days', 1)
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
      knex.raw('CASE WHEN ii.quantityOnHand IS NOT NULL THEN ii.expiresOn ELSE NULL END as expirationDate'),
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
            this.on('DistTable.siteId', 's.id').andOn('DistTable.deviceTypeId', 'dt.id')
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
  const baseWithCalculatedFields = knex.from(baseInventoryItemsBySiteGeography.as('t1')).select(
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
    payload: { toSiteId, consumableId, expiresOn, lotNumber, quantity, reasonId, dateAdjusted, notes },
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
    return Boom.forbidden('You are not permitted to remove inventory from this site')
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
    payload: { fromSiteId, toSiteId, consumableId, expiresOn, lotNumber, quantity, dateAdjusted, notes },
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
    return Boom.forbidden('You are not permitted to transfer inventory to this site')
  }

  const fromSite = await getSite(fromSiteId, dataConstraints)

  if (!fromSite) {
    return Boom.forbidden('You are not permitted to transfer inventory from this site')
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()

  const sourceInventoryItem = await findInventoryItem(fromSiteId, consumableId, expiresOn, lotNumber)

  const destinationInventoryItem = await findInventoryItem(toSiteId, consumableId, expiresOn, lotNumber, fromSiteId)
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

    const { id: transferSentConsumableReasonId } = await findConsumableReason('Transfer Sent')

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
      referencedSiteId: toSiteId,
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
    payload: { fromSiteId, toSiteId, consumableId, expiresOn, lotNumber, quantity, dateAdjusted, notes },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const toSite = await getSite(toSiteId, dataConstraints)

  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const sourceInventoryItem = await findInventoryItem(toSiteId, consumableId, expiresOn, lotNumber, fromSiteId)
  if (_.isEmpty(sourceInventoryItem)) {
    return Boom.notFound('Could not find source item')
  }
  const destinationInventoryItem = await findInventoryItem(toSiteId, consumableId, expiresOn, lotNumber)
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

    const { id: transferReceivedConsumableReasonId } = await findConsumableReason('Transfer Received')

    await logInventoryChange({
      knex,
      inventoryItemId: destinationInventoryItemId,
      consumableId,
      siteId: toSiteId,
      referencedSiteId: fromSiteId,
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
  const inventoryItem = await findInventoryItem(siteId, consumableId, expiresOn, lotNumber)
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

async function checkOpenedStockIssues({ knex, siteId, consumableId, now, messageContext }) {
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
      knex.raw('MAX(p.dueDaysInventoryStockExpiring) as dueDaysInventoryStockExpiring')
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

async function checkStockoutIssues({ knex, siteId, consumableId, dailyRate, dueDays, messageContext }) {
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

async function checkStockExpiringIssues({ knex, siteId, consumableId, dailyRate, dueDays, messageContext }) {
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
  referencedSiteId = null,
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
    referencedSiteId,
    consumableReasonId,
    resultId,
    lotNumber,
    expiresOn: parseDateOrDefault(expiresOn) || null,
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
      quantityOnHand: _.isUndefined(quantityOnHand) ? knex.raw(`quantityOnHand + (${quantity})`) : quantityOnHand,
      updatedOn: now,
      updatedBy: userId,
    })
  }
  return inventoryItemId
}

async function updateInventoryItem(knex, inventoryItemId, inventoryItemValues) {
  const updateValues = {}
  if (typeof inventoryItemValues.expiresOn !== 'undefined') {
    updateValues.expiresOn = inventoryItemValues.expiresOn ? parseDateOrDefault(inventoryItemValues.expiresOn) : null
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
    insertValues.expiresOn = inventoryItemValues.expiresOn ? parseDateOrDefault(inventoryItemValues.expiresOn) : null
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

async function modifyInventoryOnHand(request) {
  const {
    auth,
    payload: { siteId, consumableId, lotNumber, quantity, notes, expiresOn },
  } = request
  const messageContext = request.plugins.messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
    resolveIssues,
    escalateIssues,
  })
  const dataConstraints = await getConstraints(auth.credentials)
  const payload = {
    siteId,
    consumableId,
    expiresOn,
    lotNumber,
    quantity,
    notes,
    messageContext,
    now: new Date(),
  }
  let result = null
  const site = await getSite(siteId, dataConstraints)
  if (!site) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  if (quantity > 0) {
    const { reasonId } =
      (await knex('ConsumableReason')
        .where('i18nKey', 'ConsumableReason_AssertedInventoryOnHandAdd')
        .first('id as reasonId')) || {}
    payload.operation = 'add'
    payload.reasonId = reasonId
    result = await increaseInventory(payload)
  } else {
    const { reasonId } =
      (await knex('ConsumableReason')
        .where('i18nKey', 'ConsumableReason_AssertedInventoryOnHandRemove')
        .first('id as reasonId')) || {}
    payload.operation = 'remove'
    payload.reasonId = reasonId
    result = await increaseInventory(payload)
  }
  return result
}

module.exports = {
  getInventoryItems,
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
  listLog,
  modifyInventoryOnHand,
  listInventoryLog,
}
