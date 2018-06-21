const _ = require('lodash')
const Boom = require('boom')
const { startOfDay } = require('date-fns')
const { getDateOrDefault, parseDateOrDefault } = require('../shared/date')
const {
  knex,
  transact,
  query,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const {
  selectAssayConsumables,
} = require('../consumable/assayConsumableService')
const { findConsumableReason } = require('../consumable/consumableService')
const { getUser } = require('../auth/service')
const { getSite } = require('../site/service')

const INVENTORY_ITEM_SELECT_LIST_FIELDS = [
  'ii.id',
  'ii.consumableId',
  'ii.siteId',
  'ii.inTransitFromSiteId',
  'ii.expiresOn',
  'ii.lotNumber',
  'ii.quantityOnHand',
  'c.name as consumableName',
  'c.manufacturer',
  'c.canExpire',
  'u.shortName as unitShortName',
  's.name as siteName',
  'g.countryId',
  'g.stateId',
  'g.lgaId',
  'co.name as countryName',
  'st.name as stateName',
  'l.name as lgaName',
  'itfs.name as inTransitFromSiteName',
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
}

const INVENTORY_ITEM_FILTER_FIELDS = {
  countryId: 'g.countryId',
  stateId: 'g.stateId',
  lgaId: 'g.lgaId',
  consumableId: 'ii.consumableId',
  siteName: 's.name',
  siteId: 'ii.siteId',
}

const INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES = { geography: 'g', site: 's' }

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
    partnerId,
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
        const matchingInventoryOnHand = findInventoryItemMatchingConsumableInResultData(
          consumablesInResultData,
          matchingInventoryItems,
          testStartedOn || testEndedOn,
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

        // Update quantity on hand
        await updateInventoryItem(knex, matchingInventoryOnHand.id, {
          quantityOnHand: knex.raw(
            `GREATEST(quantityOnHand - ${assayConsumable.quantity}, 0)`
          ),
          updatedBy: null,
          updatedOn: now,
        })
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
    .select()
  if (existingItems.length > 0) {
    return existingItems
  }

  // TODO should we create a new item for each consumable in result data?
  // instead of just the first
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
    expiresOn: expirationDateInResultData
      ? startOfDay(expirationDateInResultData)
      : undefined,
    quantity: 0,
    now,
  })

  const newItem = await knex('InventoryItem')
    .where({ id: newInventoryItemId })
    .first()
  return [newItem]
}

function findInventoryItemMatchingConsumableInResultData(
  consumablesInResultData,
  inventoryItems,
  testedOn,
  now
) {
  if (inventoryItems.length === 1) {
    // If we only have one candidate, use it!
    return inventoryItems[0]
  } else if (inventoryItems.length < 2) {
    throw new Error('We should always have at least one candidate item.')
  }

  // Normalize input data for comparisons below
  let hasItemExpiresOn = false
  let hasItemLot = false
  let hasConsumable = false
  let hasConsumableExpiresOn = false
  let hasConsumableLot = false

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

  const consumables = _.map(consumablesInResultData, consumable => {
    const consumableExpirationDate = parseDateOrDefault(
      consumable.expirationDate
    )
    const normalizedConsumable = {
      expiresOn: consumableExpirationDate
        ? startOfDay(consumableExpirationDate)
        : null,
      lot: consumable.lot ? consumable.lot : null,
    }
    hasConsumable = true
    hasConsumableExpiresOn =
      hasConsumableExpiresOn || normalizedConsumable.expiresOn != null
    hasConsumableLot = hasConsumableLot || normalizedConsumable.lot != null
    return normalizedConsumable
  })

  if (hasConsumable) {
    // Exact match of expire on and lot number
    if (
      hasItemExpiresOn &&
      hasItemLot &&
      hasConsumableExpiresOn &&
      hasConsumableLot
    ) {
      for (const item of items) {
        if (item.expiresOn == null) {
          break // Ordered by expiresOn, nulls last
        }

        for (const consumable of consumables) {
          const matchExpiresAndLotNumber =
            item.lot != null &&
            _.isEqual(consumable.expiresOn, item.expiresOn) &&
            _.isEqual(consumable.lot, item.lot)
          if (matchExpiresAndLotNumber) {
            return item.inventoryItem
          }
        }
      }
    }

    // Exact match of expiration date
    if (hasItemExpiresOn && hasConsumableExpiresOn) {
      for (const item of items) {
        if (item.expiresOn == null) {
          break
        }

        for (const consumable of consumables) {
          const matchExpires = _.isEqual(consumable.expiresOn, item.expiresOn)
          if (matchExpires) {
            return item.inventoryItem
          }
        }
      }
    }

    // Exact match of lot number
    if (hasItemLot && hasConsumableLot) {
      for (const item of items) {
        for (const consumable of consumables) {
          const matchLot =
            item.lot != null && _.isEqual(consumable.lot, item.lot)
          if (matchLot) {
            return item.inventoryItem
          }
        }
      }
    }

    // Closest expiration date
    /*
    if (hasItemExpiresOn && hasConsumableExpiresOn) {
      const previousItemExpiresOn = items[0].expiresOn
      for (const item of items.slice(1)) {
        if (item.expiresOn == null) {
          break
        }

        for (const consumable of consumables) {
        }
      }
    }
    */
  }

  // Find Least recent inventory item that expires after test started
  if (hasItemExpiresOn) {
    const itemCutoffDate = startOfDay(testedOn || now)
    for (const item of items) {
      if (item.expiresOn == null) {
        break
      }
      const itemExpireAfterTest = item.expiresOn >= itemCutoffDate
      if (itemExpireAfterTest) {
        return item.inventoryItem
      }
    }
  }

  //  If all else fails, use first match, due to order of query,
  //  this is the least recent expiresOn, then the most recent createdOn
  //  Note we should always have at least one item since we create
  //  if does not exist per AssayConsumable
  return items[0].inventoryItem
}

async function listInventoryItems(request) {
  const { auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const inventoryItemsQuery = query('Search Inventory Items')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .where('ii.quantityOnHand', '<>', 0)
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, INVENTORY_ITEM_FILTER_FIELDS)
    .modify(
      addConstraints,
      dataConstraints,
      INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES
    )

  const getCount = inventoryItemsQuery
    .clone()
    .count('ii.id as count')
    .first()

  const getItems = inventoryItemsQuery
    .modify(
      sortPageParams,
      request.query,
      INVENTORY_ITEM_SORT_FIELDS.siteName,
      INVENTORY_ITEM_SORT_FIELDS
    )
    .select(INVENTORY_ITEM_SELECT_LIST_FIELDS)

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
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
]

async function listInventoryItemsGroupedBySite(request) {
  const { auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  /* TODO: Add inventory item <--> site bridging table and fix this query so that
     user can view items that are out of stock */
  /* TODO: Add option to break out by expiration date */
  const inventoryItemsSiteByGeographyQuery = query(
    'Join Inventory Items, Site Details, and Geography Details'
  )
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .where('ii.quantityOnHand', '<>', 0)
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')

  const sitesQuery = inventoryItemsSiteByGeographyQuery
    .clone()
    .modify(filterParams, request.query, INVENTORY_ITEM_FILTER_FIELDS)
    .modify(
      addConstraints,
      dataConstraints,
      INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES
    )

  const getSiteCount = sitesQuery
    .clone()
    .countDistinct('ii.siteId as count')
    .first()

  const sortAggregate = request.query.sortDir === 'desc' ? 'MAX' : 'MIN'
  const sortColumnName = request.query.sortCol || 'siteName'
  let sortColumnField = INVENTORY_ITEM_SORT_FIELDS[sortColumnName]
  if (sortColumnName === 'expiresOn') {
    const defaultDateOrderBy =
      request.query.sortDir === 'desc'
        ? '1000-01-01 00:00:00'
        : '9999-12-31 23:59:59'
    sortColumnField = `COALESCE(${
      INVENTORY_ITEM_SORT_FIELDS[sortColumnName]
    }, '${defaultDateOrderBy}')`
  }
  const aggregateColumn = `${sortAggregate}(${sortColumnField}) as ${sortColumnName}`
  const getSiteIds = sitesQuery
    .groupBy('ii.siteId')
    .select('ii.siteId', knex.raw(aggregateColumn))
    .modify(sortPageParams, request.query, sortColumnName)

  const [{ count: total }, sitesData] = await Promise.all([
    getSiteCount,
    getSiteIds,
  ])

  const inventoryItemFilters = Object.assign({}, request.query, {
    siteId: _.map(sitesData, 'siteId'),
  })

  const sortDirection = request.query.sortDir === 'desc' ? 'desc' : 'asc'
  const inventoryItems = await inventoryItemsSiteByGeographyQuery
    .modify(filterParams, inventoryItemFilters, INVENTORY_ITEM_FILTER_FIELDS)
    .modify(
      addConstraints,
      dataConstraints,
      INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES
    )
    .orderBy('sortBy', sortDirection)
    .select([
      ...INVENTORY_ITEM_SELECT_LIST_FIELDS,
      knex.raw(`${sortColumnField} as sortBy`),
    ])

  const sites = _.uniqBy(
    _.map(inventoryItems, inventoryItem => _.pick(inventoryItem, siteFields)),
    'siteId'
  )
  const sitesWithConsumables = _.map(sites, siteRecord => {
    const siteItems = _.filter(inventoryItems, { siteId: siteRecord.siteId })
    return Object.assign({}, siteRecord, {
      inventoryItems: _.map(siteItems, siteItem =>
        _.pick(siteItem, inventoryItemFields)
      ),
    })
  })

  return {
    ok: true,
    total,
    length: sitesWithConsumables.length,
    data: sitesWithConsumables,
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
  if (inTransitFromSiteId) {
    matchingInventoryItemsQuery.where(
      'ii.inTransitFromSiteId',
      inTransitFromSiteId
    )
  } else {
    matchingInventoryItemsQuery.whereNull('ii.inTransitFromSiteId')
  }
  const matchingInventoryItems = await matchingInventoryItemsQuery.select(
    INVENTORY_ITEM_SELECT_LIST_FIELDS
  )
  return (
    _.find(matchingInventoryItems, { lotNumber }) ||
    _.head(matchingInventoryItems)
  )
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
    .first(INVENTORY_ITEM_SELECT_LIST_FIELDS)
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
    .select(INVENTORY_ITEM_SELECT_LIST_FIELDS)
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
    params: { inventoryItemId },
  } = request

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
  const sourceInventoryItem = await getInventoryItem(inventoryItemId)
  if (_.isEmpty(sourceInventoryItem)) {
    return Boom.notFound('Could not find source item')
  }

  const destinationInventoryItem = await findInventoryItem(
    toSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    fromSiteId
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
      inTransitFromSiteId: fromSiteId,
    })

    const { id: transferSentConsumableReasonId } = await findConsumableReason(
      'Transfer Sent'
    )

    await logInventoryChange({
      knex,
      inventoryItemId,
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

    await knex('InventoryItem')
      .where('id', inventoryItemId)
      .update({
        expiresOn,
        lotNumber,
        siteId: fromSiteId,
        quantityOnHand: knex.raw(`GREATEST(quantityOnHand - ${quantity}, 0)`),
        updatedOn: now,
        updatedBy: currentlyLoggedInUser.id,
      })
  })

  return {
    ok: true,
    data: {
      existingInventoryItem: await getInventoryItem(inventoryItemId),
      newInventoryItem: await getInventoryItem(destinationInventoryItemId),
    },
  }
}

async function receiveInventory(request) {
  const {
    auth,
    payload: {
      toSiteId,
      consumableId,
      expiresOn,
      lotNumber,
      quantity,
      dateAdjusted,
      notes,
    },
    params: { inventoryItemId },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const toSite = await getSite(toSiteId, dataConstraints)

  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const sourceInventoryItem = await getInventoryItem(inventoryItemId)
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

    const {
      id: transferReceivedConsumableReasonId,
    } = await findConsumableReason('Transfer Received')

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

    await knex('InventoryItem')
      .where('id', inventoryItemId)
      .delete()
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

async function updateInventoryStockLevel(request) {
  const {
    auth,
    params: { siteId, consumableId },
    payload: { quantity },
  } = request

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()

  const inventoryItemId = await changeInventoryQuantity({
    siteId,
    consumableId,
    quantity,
    quantityOnHand: quantity,
    now,
    operation: 'update stock',
    userId: currentlyLoggedInUser.id,
  })

  return {
    ok: true,
    data: await getInventoryItem(inventoryItemId),
  }
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
  })

  return inventoryItemId
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
    expiresOn: expiresOn ? startOfDay(expiresOn) : null,
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
      quantityOnHand: _.max([
        _.isUndefined(quantityOnHand) ? quantity : quantityOnHand,
        0,
      ]),
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
        ? knex.raw(`GREATEST(quantityOnHand + (${quantity}), 0)`)
        : _.max([quantityOnHand, 0]),
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
      ? startOfDay(inventoryItemValues.expiresOn)
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
  if (typeof inventoryItemValues.updatedOn !== 'undefined') {
    updateValues.updatedOn = inventoryItemValues.updatedOn
  }
  if (typeof inventoryItemValues.updatedBy !== 'undefined') {
    updateValues.updatedBy = inventoryItemValues.updatedBy
  }
  await knex('InventoryItem')
    .where('id', inventoryItemId)
    .update(updateValues)
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
      ? startOfDay(inventoryItemValues.expiresOn)
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
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  consumeInventoryForResult,
  increaseInventory,
  decreaseInventory,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  selectInventoryStockAtSite,
  updateInventoryStockLevel,
}
