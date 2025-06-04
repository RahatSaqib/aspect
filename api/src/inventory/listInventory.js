const { getConstraints } = require('../auth/constraints')
const { appendSiteConsumables, getInventoryBySitesAndConsumableQuery, getConsumableStrategy } = require('./common/db')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../db')
const { splitCsvWithTrim } = require('../shared/string')
const { DAYS_STOCK_LEFT_RANGES } = require('../shared/constants')
const { INVENTORY_ITEM_SORT_FIELDS } = require('./common/querySelectors')
const {
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
} = require('./common/querySelectors')
const { addConstraints } = require('../auth/constraints')

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

  const getCount = knex.from(inventoryQuery.clone().as('q')).count({ count: '*' }).first()
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

function getInventoryByLotQuery(request, dataConstraints, consumableStrategy) {
  return knex('Site as s')
    .innerJoin('Consumable as c')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .innerJoin('SiteConsumable as sc', builder => {
      builder.on('s.id', 'sc.siteId').andOn('c.id', 'sc.consumableId')
    })
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('InventoryItem as ii', builder => {
      builder.on('s.id', 'ii.siteId').andOn('c.id', 'ii.consumableId')
    })
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .leftJoin('ConsumableAssay as ca', 'c.id', 'ca.consumableId')
    .leftJoin(
      knex('Result as r')
        .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
        .whereNull('r.reconciliationDate')
        .select(
          'r.siteId',
          'ca.consumableId as consumableId',
          'r.consumableLot as lotNumber',
          'r.consumableExpirationDate as expiresOn',
          knex.raw('COUNT(*) as unreconciledCount')
        )
        .groupBy('r.siteId', 'ca.consumableId')
        .as('unreconciled'),
      builder => {
        builder.on('unreconciled.siteId', 's.id').andOn('unreconciled.consumableId', 'c.id')
        consumableStrategy
          .filterFields({
            lotNumberField: 'unreconciled.lotNumber <=> ii.lotNumber',
            expiresOnField: 'unreconciled.expiresOn <=> ii.expiresOn',
          })
          .forEach(field => builder.andOn(knex.raw(field)))
      }
    )
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      ...SUM_STOCK_LEFT_FILTER_FIELDS,
    })
    .modify(queryBuilder => {
      if (request.query.siteIds) {
        queryBuilder.whereIn('s.id', request.query.siteIds.split(','))
      }
    })
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)
    .groupBy([
      'c.id',
      's.id',
      'ii.inTransitFromSiteId',
      ...consumableStrategy.filterFields({
        lotNumberField: 'ii.lotNumber',
        expiresOnField: 'ii.expiresOn',
      }),
    ])
    .select([
      /*
       * TODO: Remove 'id' from the projection.
       * It's currently included only to support legacy Redux code and a complex mapping structure on the frontend.
       * The API itself does not require this field in other endpoints.
       */
      knex.raw(`
        CONCAT(
            c.id, '-',
            s.id, '-',
            ${consumableStrategy
              .filterFields({
                lotNumberField: `IFNULL(ii.expiresOn, ''), '-',`,
                expiresOnField: `IFNULL(ii.lotNumber, ''), '-',`,
              })
              .join('')}
            IFNULL(ii.inTransitFromSiteId, '')
        ) AS id
      `),
      /*
       * TODO: Clean up the projection — the frontend likely doesn't use all of these fields.
       */
      'ca.assayId as assayId',
      'c.id as consumableId',
      'c.name as consumableName',
      'c.manufacturer',
      'c.canExpire',
      'p.inventoryStrategy as strategy',
      'u.shortName as unitShortName',
      's.id as siteId',
      's.name as siteName',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'co.name as countryName',
      'st.name as stateName',
      'l.name as lgaName',
      'ii.updatedOn',
      'itfs.name as inTransitFromSiteName',
      'ii.inTransitFromSiteId',
      ...consumableStrategy.filterFields({
        lotNumberField: 'ii.lotNumber AS lotNumber',
        expiresOnField: 'ii.expiresOn AS expiresOn',
      }),
      knex.raw('SUM(ii.quantityOnHand) AS quantityOnHand'),
      knex.raw('IFNULL(unreconciled.unreconciledCount, 0) AS unreconciledQuantity'),
    ])
}
