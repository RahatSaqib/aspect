const strategies = require('../strategies')
const { knex, filterDateRangeParams, query, filterParams } = require('../../db')
const {
  INVENTORY_ITEMS_TABLE_WITH_STRATEGY,
  INVENTORY_ITEM_SELECT,
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
} = require('./querySelectors')
const { addConstraints } = require('../../auth/constraints')

async function getConsumableStrategy(consumableId) {
  const { strategy } = await knex('Consumable').where({ id: consumableId }).first('strategy')
  return strategies[strategy]
}

function baseInventoryQuery(siteId, consumableId, inTransitFromSiteId) {
  const matchingInventoryItemsQuery = knex('InventoryItem as ii')
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

  if (inTransitFromSiteId) {
    matchingInventoryItemsQuery.where('ii.inTransitFromSiteId', inTransitFromSiteId)
  } else {
    matchingInventoryItemsQuery.whereNull('ii.inTransitFromSiteId')
  }
  return matchingInventoryItemsQuery
}

function getInventoryItemsRawQuery() {
  const fldExpiresOn = `DATE_FORMAT(IFNULL(ii.expiresOn, NOW()), '%Y-%m-%d')`
  const fldQuantity = `CAST( IFNULL(ii.quantityOnHand, 0) AS CHAR )`
  const itemRaw = `CONCAT(
    '{ "expiresOn": "', ${fldExpiresOn}, '", "quantityOnHand": "', ${fldQuantity}, '" }'
  )`

  /**
   * assemble json array from '[' and ']', and json object strings of all
   * grouped items
   * with props `{ "expiresOn": "...", "quantityOnHand": "..." }`
   */
  return `CONCAT(
    '[',
      GROUP_CONCAT(${itemRaw} SEPARATOR ','),
    ']'
  )`
}

function getInventorySitesQuery(constraints, request) {
  const inventoryItemsRaw = getInventoryItemsRawQuery()

  return query('Search Inventory Sites')
    .from('Site as s')
    .innerJoin('Consumable as c')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('FactInventoryConsumptionRate as ficr', builder => {
      builder.on('s.id', 'ficr.siteId').andOn('c.id', 'ficr.consumableId').andOn(knex.raw('ficr.days = 1'))
    })
    .leftJoin('InventoryItem as ii', builder => {
      builder.on('s.id', 'ii.siteId').andOn('c.id', 'ii.consumableId').andOn(knex.raw('ii.inTransitFromSiteId IS NULL'))
      // we are interested in unexpired yet as of today
      // .andOn(knex.raw('ii.expiresOn >= DATE(NOW())'))
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
      if (request.query.daysStockLeft === 'noConsumption') builder.where('ficr.rate', 0).orWhereNull('ficr.rate')
      else if (request.query.daysStockLeft === 'notRecorded') builder.whereNull('ii.id')
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
      knex.raw('SUM(ii_transfer.quantityOnHand) as pendingTransfersQuantityOnHand'),
      knex.raw(
        `sum(
          case when ii.expiresOn < DATE(NOW()) then ii.quantityOnHand else 0 end 
        ) as qtyExpired`
      ),
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN TRUE ELSE FALSE END AS showLot`
      ),
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN TRUE ELSE FALSE END AS showExpirationDate`
      ),
      knex.raw(`CASE WHEN IFNULL(ficr.rate, 0) = 0
          THEN null
          ELSE GetDaysStockLeft(NOW(), ficr.rate, ${inventoryItemsRaw})
        END as daysStockLeft`),
      knex.raw(
        `CASE WHEN IFNULL(ficr.rate, 0) = 0
          THEN null
          ELSE GetProjectedWaste(NOW(), ficr.rate, ${inventoryItemsRaw})
        END as projectedWaste`
      ),
    ])
}

async function findInventoryItems(
  siteId,
  consumableId,
  expiresOn = null,
  lotNumber = null,
  inTransitFromSiteId = null,
  select = INVENTORY_ITEMS_TABLE_WITH_STRATEGY
) {
  const matchingInventoryItemsQuery = baseInventoryQuery(siteId, consumableId, inTransitFromSiteId)
  if (lotNumber || expiresOn) {
    const matchingStrategy = await getConsumableStrategy(consumableId)
    if (matchingStrategy) matchingStrategy(matchingInventoryItemsQuery, { lotNumber, expiresOn })
  }
  const matchingInventoryItems = await matchingInventoryItemsQuery
    .clone()
    .orderByRaw('ii.expiresOn is null')
    .orderBy('ii.expiresOn', 'asc')
    .orderBy('ii.createdOn', 'desc')
    .orderBy('ii.id', 'desc')
    .select(select)

  return matchingInventoryItems
}

async function findInventoryItem(siteId, consumableId, expiresOn, lotNumber, inTransitFromSiteId) {
  const matchingInventoryItemsQuery = baseInventoryQuery(siteId, consumableId, inTransitFromSiteId)
  const matchingStrategy = await getConsumableStrategy(consumableId)

  if (matchingStrategy) {
    matchingStrategy(matchingInventoryItemsQuery, { lotNumber, expiresOn })
  }

  const matchingInventoryItems = await matchingInventoryItemsQuery.first(INVENTORY_ITEM_SELECT)

  return matchingInventoryItems
}
const getInventoryLogBaseQuery = (knex, dataConstraints) =>
  knex('InventoryLog as il')
    .innerJoin('Consumable as c', 'il.consumableId', 'c.id')
    .innerJoin('Site as s', 'il.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
    .leftJoin('Result as r', 'il.resultId', 'r.id')
    .leftJoin('Site as refSite', 'il.referencedSiteId', 'refSite.id')
    .leftJoin('Sample as sam', 'r.sampleId', 'sam.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })

module.exports = {
  findInventoryItem,
  findInventoryItems,
  getInventorySitesQuery,
  getInventoryLogBaseQuery,
}
