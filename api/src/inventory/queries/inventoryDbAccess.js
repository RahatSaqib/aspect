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

async function findInventoryItem(
  siteId,
  consumableId,
  expiresOn,
  lotNumber,
  inTransitFromSiteId
) {
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
  const matchingStrategy = await getConsumableStrategy(consumableId)
  if (matchingStrategy)
    matchingStrategy(matchingInventoryItemsQuery, { lotNumber, expiresOn })

  if (inTransitFromSiteId) {
    matchingInventoryItemsQuery.where(
      'ii.inTransitFromSiteId',
      inTransitFromSiteId
    )
  } else {
    matchingInventoryItemsQuery.whereNull('ii.inTransitFromSiteId')
  }
  const matchingInventoryItems = await matchingInventoryItemsQuery.first(
    INVENTORY_ITEM_SELECT
  )
  return matchingInventoryItems
}

module.exports = {
  findInventoryItem,
  INVENTORY_ITEM_SELECT,
  INVENTORY_COMMON_FIELDS,
}
