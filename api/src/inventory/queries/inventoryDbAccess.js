const _ = require('lodash')

const strategies = require('../strategies')

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

async function findInventoryItem(
  knex,
  siteId,
  consumableId,
  inTransitFromSiteId,
  lotNumber,
  expiresOn
) {
  const { strategy } = knex('Consumable')
    .where({ consumableId })
    .first('strategy')

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
  const matchingStrategy = strategies[strategy]
  if (matchingStrategy)
    matchingStrategy(matchingInventoryItems, { lotNumber, expiresOn })

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

module.exports = {
  findInventoryItem,
}
