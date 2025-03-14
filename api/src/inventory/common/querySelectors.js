const { knex } = require('../../db')

const CONCATENATED_ID = `CONCAT(
  c.id,
  '-',
  s.id,
  '-',
  IFNULL(ii.expiresOn, ''), '-',
  IFNULL(ii.lotNumber, ''), '-',
  IFNULL(ii.inTransitFromSiteId, '')
)`

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

const INVENTORY_LOG_LIST = {
  createdOn: 'il.createdOn',
  consumableName: 'c.name',
  assayId: 'ca.assayId',
  consumableNameI18nKey: 'c.i18nKey',
  lotNumber: 'il.lotNumber',
  reconcilationAdjustment: 'il.reconcilationAdjustment',
  reconcilationStrategy: 'il.reconcilationStrategy',
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
  consumableReasonExternalId: 'cr.externalId',
  transactionDate: 'il.adjustedFrom',
  resultEndedOn: 'r.endedOn',
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

const INVENTORY_TRANSFER = {
  consumableName: 'c.name',
  consumableNameI18nKey: 'c.i18nKey',
  lotNumber: 'oil.lotNumber',
  originSiteName: 'originSite.name',
  destinationSiteName: 'destinationSite.name',
  sentQuantity: 'oil.quantity',
  receivedQuantity: 'iil.quantity',
  expirationDate: 'oil.expiresOn',
  sentOn: 'oil.createdOn',
  receivedOn: 'iil.createdOn',
}

// Select for inventory grouped by site and consumable
const INVENTORY_ITEM_SELECT_LIST_FIELDS = [...INVENTORY_COMMON_FIELDS, knex.raw('SUM(ii.quantityOnHand)')]

// Select for inventory split by lot
const INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS = [
  knex.raw(`
    CONCAT(
        c.id, '-',
        s.id, '-',
        IFNULL(ii.expiresOn, ''), '-',
        IFNULL(ii.lotNumber, ''), '-',
        IFNULL(ii.inTransitFromSiteId, '')
    ) AS id
  `),
  'ca.assayId as assayId',

  // Filter fields from INVENTORY_ITEM_SELECT
  ...INVENTORY_ITEM_SELECT.filter(field => {
    if (typeof field === 'string') {
      return field !== 'ii.id' && field !== 'ii.quantityOnHand'
    }
    // For knex objects, convert to string before filtering
    const fieldString = field.toString()
    return (
      !fieldString.includes('CASE WHEN p.inventoryStrategy') &&
      !fieldString.includes('ii.id') &&
      !fieldString.includes('ii.quantityOnHand')
    )
  }),
  'ii.lotNumber AS lotNumber',
  'ii.expiresOn AS expiresOn',
  knex.raw('SUM(ii.quantityOnHand) AS quantityOnHand'),
  knex.raw(`
    (
      SELECT COUNT(*)
      FROM MissingInventoryLots mil
      INNER JOIN Result r ON mil.resultId = r.id
      INNER JOIN ConsumableAssay ca ON r.assayId = ca.assayId
      INNER JOIN Consumable c ON ca.consumableId = c.id
      WHERE mil.siteId = s.id
      AND c.id = ii.consumableId
    ) AS unreconciledQuantity
  `),
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
  transactionDate: 'il.adjustedFrom',
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
  INVENTORY_TRANSFER,
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
  CONCATENATED_ID,
  INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY,
}
