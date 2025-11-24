const { knex } = require('../../db')

const INVENTORY_COMMON_FIELDS = [
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
]

function createInventoryItemSelect(includeStrategy = true) {
  const baseFields = [
    ...INVENTORY_COMMON_FIELDS,
    'ii.quantityOnHand',
    'ii.updatedOn',
    'ii.id',
    'itfs.name as inTransitFromSiteName',
    'ii.inTransitFromSiteId',
    'ii.reconciliationStartDate',
  ]

  if (includeStrategy) {
    baseFields.push(
      knex.raw(
        `CASE WHEN p.inventoryStrategy IS NOT NULL AND INSTR(p.inventoryStrategy,'withlot')>0 THEN ii.lotNumber ELSE null END AS lotNumber`
      ),
      knex.raw(
        `CASE WHEN p.inventoryStrategy IS NOT NULL AND INSTR(p.inventoryStrategy,'expirationDate')>0 THEN ii.expiresOn ELSE null END AS expiresOn`
      )
    )
  } else {
    baseFields.push('ii.lotNumber', 'ii.expiresOn')
  }

  return baseFields
}

const INVENTORY_ITEM_SELECT = createInventoryItemSelect()
const INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY = createInventoryItemSelect(false)

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
  hasStock: queryBuilder => queryBuilder.havingRaw('IFNULL(quantityOnHand, 0) <> 0'),
}

const INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES = { geography: 'g', site: 's' }

const SUPPLY_IN_STOCK_FIELDS = [
  'consumableId',
  'consumableName',
  knex.raw('COUNT(CASE WHEN daysStockLeft IS NOT NULL AND daysStockLeft = 0 THEN true ELSE null END) as outOfStock'),
  knex.raw(
    'COUNT(CASE WHEN daysStockLeft IS NOT NULL AND daysStockLeft BETWEEN 1 and 14 THEN true ELSE null END) as upTo14'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysStockLeft IS NOT NULL AND daysStockLeft BETWEEN 15 and 30 THEN true ELSE null END) as upTo30'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysStockLeft IS NOT NULL AND daysStockLeft BETWEEN 31 and 90 THEN true ELSE null END) as upTo90'
  ),
  knex.raw(
    'COUNT(CASE WHEN daysStockLeft IS NOT NULL AND daysStockLeft BETWEEN 91 and 180 THEN true ELSE null END) as upTo180'
  ),
  knex.raw('COUNT(CASE WHEN daysStockLeft IS NOT NULL AND daysStockLeft > 180 THEN true ELSE null END) as moreThan180'),
  knex.raw('COUNT(CASE WHEN daysStockLeft IS NULL AND quantityOnHand IS NULL THEN true ELSE null END) as notRecorded'),
  knex.raw(
    'COUNT(CASE WHEN daysStockLeft IS NULL AND quantityOnHand IS NOT NULL THEN true ELSE null END) as noConsumption'
  ),
]

module.exports = {
  INVENTORY_ITEM_SORT_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  SUPPLY_IN_STOCK_FIELDS,
  INVENTORY_ITEM_SELECT,
  INVENTORY_COMMON_FIELDS,
  STOCK_LEFT_FILTER_FIELDS,
  INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY,
}
