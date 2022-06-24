const strategies = require('../strategies')
const { knex } = require('../../db')

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
const INVENTORY_ITEMS_TABLE_WITH_STRATEGY = [
  'ii.id',
  'ii.consumableId',
  'ii.siteId',
  'ii.inTransitFromSiteId',
  knex.raw(
    `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN ii.lotNumber ELSE null END AS lotNumber`
  ),
  knex.raw(
    `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN ii.expiresOn ELSE null END AS expiresOn`
  ),
  'ii.quantityOnHand',
  'ii.createdOn',
  'ii.createdBy',
  'ii.updatedOn',
  'ii.updatedBy',
]
const INVENTORY_ITEM_SELECT = [
  ...INVENTORY_COMMON_FIELDS,
  'ii.quantityOnHand',
  'ii.id',
  knex.raw(
    `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN ii.lotNumber ELSE null END AS lotNumber`
  ),
  knex.raw(
    `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN ii.expiresOn ELSE null END AS expiresOn`
  ),

  'itfs.name as inTransitFromSiteName',
  'ii.inTransitFromSiteId',
]

async function getConsumableStrategy(consumableId) {
  const { strategy } = await knex('Consumable')
    .where({ id: consumableId })
    .first('strategy')
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
    matchingInventoryItemsQuery.where(
      'ii.inTransitFromSiteId',
      inTransitFromSiteId
    )
  } else {
    matchingInventoryItemsQuery.whereNull('ii.inTransitFromSiteId')
  }
  return matchingInventoryItemsQuery
}

async function findInventoryItems(
  siteId,
  consumableId,
  expiresOn = null,
  lotNumber = null,
  inTransitFromSiteId = null,
  select = INVENTORY_ITEMS_TABLE_WITH_STRATEGY
) {
  const matchingInventoryItemsQuery = baseInventoryQuery(
    siteId,
    consumableId,
    inTransitFromSiteId
  )
  if (lotNumber || expiresOn) {
    const matchingStrategy = await getConsumableStrategy(consumableId)
    if (matchingStrategy)
      matchingStrategy(matchingInventoryItemsQuery, { lotNumber, expiresOn })
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

async function findInventoryItem(
  siteId,
  consumableId,
  expiresOn,
  lotNumber,
  inTransitFromSiteId
) {
  const matchingInventoryItemsQuery = baseInventoryQuery(
    siteId,
    consumableId,

    inTransitFromSiteId
  )
  const matchingStrategy = await getConsumableStrategy(consumableId)
  if (matchingStrategy)
    matchingStrategy(matchingInventoryItemsQuery, { lotNumber, expiresOn })

  const matchingInventoryItems = await matchingInventoryItemsQuery.first(
    INVENTORY_ITEM_SELECT
  )
  return matchingInventoryItems
}

module.exports = {
  findInventoryItem,
  findInventoryItems,
  INVENTORY_ITEM_SELECT,
  INVENTORY_COMMON_FIELDS,
}
