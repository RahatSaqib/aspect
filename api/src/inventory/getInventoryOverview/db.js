const subDays = require('date-fns/subDays')
// eslint-disable-next-line no-unused-vars
const { knex, filterDateRangeParams, filterParams } = require('../../db')
const {
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
} = require('../common/querySelectors')

const { addConstraints } = require('../../auth/constraints')

module.exports = async function (query, constraints) {
  if (!query?.maxDate) {
    query.maxDate = new Date()
  }
  if (!query?.minDate) {
    query.minDate = subDays(new Date(query.maxDate), 1000).toISOString()
  }

  // const inventoryItemsRaw = getInventoryItemsRawQuery()

  const request = { query }
  // const siteQuery = getInventorySitesQuery(dataConstraints, { query })
  const siteQuery = knex
    .from('Site as s')
    .crossJoin('Consumable as c')
    .leftJoin('SiteType as stype', 's.siteTypeId', 'stype.id')
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
    })
    .leftJoin('InventoryItem as ii_transfer', builder => {
      builder
        .on('s.id', 'ii_transfer.siteId')
        .andOn('c.id', 'ii_transfer.consumableId')
        .andOn(knex.raw('ii_transfer.inTransitFromSiteId IS NOT NULL'))
    })
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      ...SUM_STOCK_LEFT_FILTER_FIELDS,
    })
    .modify(builder => {
      if (request.query.daysStockLeft === 'noConsumption') builder.where('ficr.rate', 0).orWhereNull('ficr.rate')
      else if (request.query.daysStockLeft === 'notRecorded') builder.whereNull('ii.id')
    })
    .modify(addConstraints, constraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)
    .orWhere(function (qb) {
      qb.where('c.id', query.consumableId).where('stype.externalId', 'warehouse')
    })
    // .where(function (qb) {
    //   qb.modify(filterDateRangeParams, request.query, 'ii.expiresOn').orWhereNull('ii.expiresOn')
    // })

    .groupBy('s.id', 'c.id')
    .select([
      'c.id as consumableId',
      's.id as siteId',
      // 's.parentWarehouseId',
      'stype.externalId as siteType',
      'c.name as consumableName',
      'c.i18nKey as consumableNameI18nKey',
      // 'c.manufacturer',
      // 'c.canExpire',
      // 'u.shortName as unitShortName',
      's.name as siteName',
      'g.id as geographyId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'co.name as countryName',
      'st.name as stateName',
      'l.name as lgaName',
      'ficr.rate as dailyConsumptionRate',
      knex.raw('SUM(ii.quantityOnHand) as quantityOnHand'),
      // knex.raw('COUNT(ii_transfer.id) as pendingTransfers'),
      // knex.raw('SUM(ii_transfer.quantityOnHand) as pendingTransfersQuantityOnHand'),
      // knex.raw(
      //   `sum(
      //     case when ii.expiresOn < DATE(NOW()) then ii.quantityOnHand else 0 end
      //   ) as qtyExpired`
      // ),
      // knex.raw(
      //   `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN TRUE ELSE FALSE END AS showLot`
      // ),
      // knex.raw(
      //   `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN TRUE ELSE FALSE END AS showExpirationDate`
      // ),
      // knex.raw(`CASE WHEN IFNULL(ficr.rate, 0) = 0
      //     THEN null
      //     ELSE GetDaysStockLeft(NOW(), ficr.rate, ${inventoryItemsRaw})
      //   END as daysStockLeft`),
      // knex.raw(
      //   `CASE WHEN IFNULL(ficr.rate, 0) = 0
      //     THEN null
      //     ELSE GetProjectedWaste(NOW(), ficr.rate, ${inventoryItemsRaw})
      //   END as projectedWaste`
      // ),
    ])

  // console.log('\x1b[1;36m', '🚀 ➜ file: db.js:107 ➜ siteQuery:', siteQuery.toString())
  const data = await siteQuery
  // TODO: filter daterange on used field
  // TODO: get used fields

  return data
}
