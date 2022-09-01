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
  'ii.updatedOn',
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
const INVENTORY_LOG_LIST = {
  createdOn: 'il.createdOn',
  consumableName: 'c.name',
  lotNumber: 'il.lotNumber',
  expirationDate: 'il.expiresOn',
  siteName: 's.name',
  quantity: knex.raw('CASE WHEN IFNULL(cr.decrease, 0) = 1 THEN -il.quantity ELSE il.quantity END'),
  consumableReason: 'cr.name',
  refSiteName: 'refSite.name',
  movementReason: knex.raw(`
      CASE
        WHEN cr.name = 'Transfer Sent' THEN CONCAT('Transfer sent to ', IFNULL(refSite.name, 'N/A'))
        WHEN cr.name = 'Transfer Received' THEN CONCAT('Received from ', IFNULL(refSite.name, 'N/A'))
        ELSE cr.name
      END`),
  notes: knex.raw(`case when sam.externalId is not null then concat('Sample ID: ', sam.externalId) else il.notes end`),
  consumableReasonI18nKey: 'cr.i18nKey',
}

const INVENTORY_LOG_UILIST = {
  createdOn: 'il.createdOn',
  consumableName: 'c.name',
  lotNumber: 'il.lotNumber',
  expirationDate: 'il.expiresOn',
  siteName: 's.name',
  quantity: knex.raw('CASE WHEN IFNULL(cr.decrease, 0) = 1 THEN -il.quantity ELSE il.quantity END'),
  consumableReasonI18nKey: 'cr.i18nKey',
  refSiteName: 'refSite.name',
  notes: knex.raw(`case when sam.externalId is not null then concat('Sample ID: ', sam.externalId) else il.notes end`),
}

// Select for inventory grouped by site and consumable
const INVENTORY_ITEM_SELECT_LIST_FIELDS = [...INVENTORY_COMMON_FIELDS, knex.raw('SUM(ii.quantityOnHand)')]

// Select for inventory split by lot
const INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS = [
  knex.raw(
    "CONCAT(c.id, '-', s.id, '-', ifnull(CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN ii.expiresOn ELSE '' END,'-'),'-', ifnull(CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN ii.lotNumber ELSE '' END,''),'-', ifnull(ii.inTransitFromSiteId,'')) as id"
  ),

  ...INVENTORY_ITEM_SELECT.filter(field => field !== 'ii.id' && field !== 'ii.quantityOnHand'),
  knex.raw('SUM(ii.quantityOnHand) AS quantityOnHand'),
]

const INVENTORY_LOG_SORT_FIELDS = {
  consumableName: 'c.name',
  siteName: 's.name',
  countryName: 'co.name',
  stateName: 'st.name',
  lgaName: 'l.name',
  quantityOnHand: 'il.quantity',
  expiresOn: 'il.expiresOn',
  lotNumber: 'il.lotNumber',
  movementReason: knex.raw(`
  CASE
    WHEN cr.name = 'Transfer Sent' THEN CONCAT('Transfer sent to ', IFNULL(refSite.name, 'N/A'))
    WHEN cr.name = 'Transfer Received' THEN CONCAT('Received from ', IFNULL(refSite.name, 'N/A'))
    ELSE cr.name
  END`),
}

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
  INVENTORY_LOG_LIST,
  INVENTORY_LOG_UILIST,
  INVENTORY_ITEM_SORT_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
  INVENTORY_ITEM_SELECT_LIST_FIELDS,
  INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS,
  INVENTORY_LOG_SORT_FIELDS,
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  SUPPLY_IN_STOCK_FIELDS,
  INVENTORY_ITEM_SELECT,
  INVENTORY_COMMON_FIELDS,
  STOCK_LEFT_FILTER_FIELDS,
}
