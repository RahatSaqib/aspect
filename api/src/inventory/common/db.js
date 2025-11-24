const _ = require('lodash')
const Boom = require('@hapi/boom')

const logger = require('../../shared/logger')
const { knex, filterDateRangeParams, query, filterParams, sortPageParams } = require('../../db')
const {
  INVENTORY_ITEM_SELECT,
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
  STOCK_LEFT_FILTER_FIELDS,
  SUPPLY_IN_STOCK_FIELDS,
} = require('./querySelectors')
const { addConstraints } = require('../../auth/constraints')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')
const consumableStrategyFactory = require('./consumableStrategies/consumableStrategyFactory')
const { getPartnerByConstraints } = require('../../partner/common/db')

// ----------------------------------------------------------------------------------
async function getConsumableStrategy(partnerId) {
  const { inventoryStrategy } = await getPartnerByConstraints({
    partner: {
      id: partnerId,
    },
  })

  return consumableStrategyFactory.getConsumableStrategy(inventoryStrategy)
}

// ----------------------------------------------------------------------------------
function baseInventoryQuery(knex, siteId, consumableId, inTransitFromSiteId) {
  const matchingInventoryItemsQuery = knex('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
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

// ----------------------------------------------------------------------------------

function getInventoryItemsRawQuery() {
  return knex.raw(`
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'expiresOn', DATE_FORMAT(IFNULL(ii.expiresOn, NOW()), '%Y-%m-%d'),
        'quantityOnHand', IFNULL(ii.quantityOnHand, 0)
      )
    )
  `)
}

// ----------------------------------------------------------------------------------
function getInventorySitesQuery(constraints, request) {
  const inventoryItemsRaw = getInventoryItemsRawQuery() // This will generate the raw SQL for inventory items

  return query('Search Inventory Sites')
    .from('Site as s')
    .innerJoin('Consumable as c')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .innerJoin('ConsumableAssay as ca', 'c.id', 'ca.consumableId')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .join('SiteType as sty', 's.siteTypeId', 'sty.id')
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
      if (request.query.daysStockLeft === 'noConsumption')
        builder.where(qb => {
          qb.where('ficr.rate', 0).orWhereNull('ficr.rate')
        })
      else if (request.query.daysStockLeft === 'notRecorded') builder.whereNull('ii.id')
    })
    .modify(addConstraints, constraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)
    .groupBy(['s.id', 'c.id', 'ficr.days'])
    .select([
      knex.raw("CONCAT(c.id, '-', s.id) as id"),
      'c.id as consumableId',
      'c.name as consumableName',
      'p.inventoryStrategy as strategy',
      'c.i18nKey as consumableNameI18nKey',
      'c.manufacturer',
      'c.canExpire',
      'u.shortName as unitShortName',
      's.id as siteId',
      's.name as siteName',
      'g.countryId',
      'ca.Assayid as assayId',
      'g.stateId',
      'g.lgaId',
      'sty.externalId as siteType',
      's.parentWarehouseId',
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
        `CASE WHEN p.inventoryStrategy IS NOT NULL AND INSTR(p.inventoryStrategy,'withlot')>0 THEN TRUE ELSE FALSE END AS showLot`
      ),
      knex.raw(
        `CASE WHEN p.inventoryStrategy IS NOT NULL AND INSTR(p.inventoryStrategy,'expirationDate')>0 THEN TRUE ELSE FALSE END AS showExpirationDate`
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

// ----------------------------------------------------------------------------------
async function findInventoryItem(knex, { siteId, consumableId, expiresOn, lotNumber, inTransitFromSiteId, partnerId }) {
  const matchingInventoryItemsQuery = baseInventoryQuery(knex, siteId, consumableId, inTransitFromSiteId)

  const consumableStrategy = await getConsumableStrategy(partnerId)

  if (!consumableStrategy.isValidLotIdentifier({ lotNumber, expiresOn })) {
    logger.warning('Invalid consumable values according to consumable strategy', {
      siteId,
      consumableId,
      expiresOn,
      lotNumber,
      partnerId,
      consumableStrategy: consumableStrategy.name,
    })
  }

  consumableStrategy.modifyConsumableMatching(matchingInventoryItemsQuery, { lotNumber, expiresOn })

  const matchingInventoryItem = await matchingInventoryItemsQuery
    .orderBy('ii.quantityOnHand', 'desc')
    .first(INVENTORY_ITEM_SELECT)
  return matchingInventoryItem
}

// ----------------------------------------------------------------------------------
const getInventoryLogBaseQuery = (knex, dataConstraints) =>
  knex('InventoryLog as il')
    .innerJoin('Consumable as c', 'il.consumableId', 'c.id')
    .innerJoin('ConsumableAssay as ca', 'ca.consumableId', 'c.id')
    .innerJoin('Site as s', 'il.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
    .leftJoin('Result as r', 'il.resultId', 'r.id')
    .leftJoin('Site as refSite', 'il.referencedSiteId', 'refSite.id')
    .leftJoin('Sample as sam', 'r.sampleId', 'sam.id')
    .modify(
      addConstraints,
      dataConstraints,
      {
        site: 's',
        geography: 'g',
      },
      { displayResult: 'all' }
    )

// ----------------------------------------------------------------------------------
async function getInventoryTransfer(query, dataConstraints, timeZoneIANA) {
  const { minDate, maxDate } = query

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

  const inventoryTransferQuery = knex('InventoryTransfer as it')
    .innerJoin('InventoryLog as oil', 'it.outcomeInventoryLogId', 'oil.id')
    .leftJoin('InventoryLog as iil', 'it.incomeInventoryLogId', 'iil.id')
    .innerJoin('Consumable as c', 'oil.consumableId', 'c.id')
    .innerJoin('Site as originSite', 'oil.siteId', 'originSite.id')
    .leftJoin('Site as destinationSite', 'oil.referencedSiteId', 'destinationSite.id')
    .innerJoin('Geography as g', 'originSite.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, {
      site: 'originSite',
      geography: 'g',
    })
    .modify(filterDateRangeParams, { minDate, maxDate }, 'oil.createdOn')
    .modify(filterParams, query, {
      originSiteName: 'originSite.name',
      destinationSiteName: 'destinationSite.name',
      consumableId: 'c.id',
      consumableName: 'c.name',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
    })
    .modify(queryBuilder => {
      if (query.originSiteIds) {
        queryBuilder.whereIn('originSite.id', query.originSiteIds)
      }
    })

  const { total } = await inventoryTransferQuery.clone().count('it.id as total').first()

  const data = await inventoryTransferQuery
    .select({
      ...INVENTORY_TRANSFER,
      sentOn: getDateTimeProjectionInTimeZoneIANA(knex, 'oil.createdOn', timeZoneIANA),
      receivedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'iil.createdOn', timeZoneIANA),
    })
    .modify(sortPageParams, query, 'it.createdOn', INVENTORY_TRANSFER)
  return { data, total }
}

// ----------------------------------------------------------------------------------
function getInventoryBySitesAndConsumableQuery(
  request,
  dataConstraints,
  range,
  columns = '*',
  includeUnreconciledCounts = true
) {
  const inventoryQuery = getInventorySitesQuery(dataConstraints, request)
    .innerJoin('Assay as a', 'ca.assayId', 'a.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .innerJoin('SiteConsumable as sc', function () {
      this.on('s.id', 'sc.siteId').andOn('c.id', 'sc.consumableId')
    })
    /**
     * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
     * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
     * in `api/src/auth/constraints.js` where user permitted deviceType is used
     */
    .whereNot('dt.externalId', 'GxAlert')
    .modify(filterParams, request.query, {
      assayId: 'a.id',
    })
    .modify(queryBuilder => {
      if (request.query.siteIds) {
        queryBuilder.whereIn('s.id', request.query.siteIds.split(','))
      }
    })

  if (includeUnreconciledCounts) {
    const unreconciledQuantitySubquery = getUnreconciledQuantitiesSubquery('uq')

    inventoryQuery
      .leftJoin(unreconciledQuantitySubquery, function () {
        this.on('s.id', 'uq.siteId').andOn('ca.assayId', 'uq.assayId')
      })
      .select('uq.unreconciledQuantity')
  }

  return knex
    .from(inventoryQuery.as('t2'))
    .modify(builder => {
      if (range) {
        builder.whereRaw(
          `daysStockLeft IS NOT NULL
          AND
          daysStockLeft >= ${range.min}
          ${_.isNil(range.max) ? '' : ` AND daysStockLeft <= ${range.max}`}
          `
        )
      }
    })
    .select(columns, 'assayId')
}

function getUnreconciledQuantitiesSubquery(alias = 'uq') {
  const siteHierarchy = `WITH RECURSIVE SiteHierarchy AS (
    SELECT
        id AS parentId,
        id AS childId
    FROM Site
    UNION ALL
    SELECT
        sh.parentId,
        childSite.id AS childId
    FROM SiteHierarchy as sh
    JOIN Site as childSite ON childSite.parentWarehouseId = sh.childId
)
SELECT parentid, childId
FROM SiteHierarchy`

  return knex
    .select('s.id as siteId', 'r.assayId')
    .count('r.id as unreconciledQuantity')
    .from('Site as s')
    .join(knex.raw(`(${siteHierarchy}) as sh`), 's.id', 'sh.parentId')
    .leftJoin('Result as r', 'r.siteId', 'sh.childId')
    .whereNull('r.reconciliationDate')
    .groupBy('s.id', 'r.assayId')
    .as(alias)
}

// ----------------------------------------------------------------------------------
function getInventoryItem(inventoryItemId, selectFields = INVENTORY_ITEM_SELECT) {
  return query('Get Inventory Item')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .where('ii.id', inventoryItemId)
    .first(selectFields)
}

// ----------------------------------------------------------------------------------
async function createInventoryTransfer(knex, outcomeInventoryLogId, tempInventoryItemId) {
  const now = new Date()
  await knex('InventoryTransfer').insert({
    outcomeInventoryLogId,
    tempInventoryItemId,
    createdOn: now,
    updatedOn: now,
  })
}

// ----------------------------------------------------------------------------------
async function updateInventoryTransfer(knex, tempInventoryItemId, incomeInventoryLogId) {
  const now = new Date()
  await knex('InventoryTransfer')
    .update({
      tempInventoryItemId: null,
      incomeInventoryLogId,
      updatedOn: now,
    })
    .where({ tempInventoryItemId })
}

// ----------------------------------------------------------------------------------
/**
 * Returns base knex query (no async/await!) with prepared/precalculated data for
 * inventories
 * @param {*} request
 * @param {*} dataConstraints
 */
function getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(request, dataConstraints) {
  const baseInventoryItemsBySiteGeography = query(
    'Join Consumable with Inventory Items, Site Details, and Geography Details'
  )
    .from('Consumable as c')
    .innerJoin('InventoryItem as ii', 'c.id', 'ii.consumableId')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('ConsumableAssay as cona', 'cona.consumableId', 'c.id')
    .innerJoin('Assay as asa', 'asa.id', 'cona.assayId')
    .innerJoin('DeviceType as dt', 'dt.id', 'asa.deviceTypeId')
    .innerJoin(
      function () {
        this.select('d.*')
          .from('Device as d')
          .innerJoin('Site as si', 'si.id', 'd.siteId')
          .innerJoin('DeviceType as det', 'det.id', 'd.deviceTypeId')
          .groupBy('d.siteId', 'd.deviceTypeId')
          .as('DistTable')
      },
      function () {
        this.on('DistTable.siteId', 's.id').andOn('DistTable.deviceTypeId', 'dt.id')
      }
    )
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Country as co', 'g.countryId', 'co.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    // dailyRate
    .leftOuterJoin('FactInventoryConsumptionRate as rate1', function () {
      this.on('rate1.siteId', 's.id').andOn('rate1.consumableId', 'c.id').andOn('rate1.days', 1)
    })
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      hasStock: knex.raw('ii.quantityOnHand <> 0'),
    })
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(addConstraints, dataConstraints, {
      ...INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
      device: 'DistTable',
    })
    .select(
      'c.id as consumableId',
      'c.name as consumableName',
      's.id as siteId',
      'ii.quantityOnHand',
      knex.raw('CASE WHEN ii.quantityOnHand IS NOT NULL THEN ii.expiresOn ELSE NULL END as expirationDate'),
      // expiresInDays - when inventory expires, in days
      knex.raw(`
        CASE
        WHEN ii.quantityOnHand IS NULL THEN NULL
        ELSE CAST(GREATEST(DATEDIFF(ii.expiresOn, NOW()), 0) AS SIGNED INTEGER)
        END AS expiresInDays
      `),
      // daily consumption rate
      knex.raw('CAST(rate1.rate AS DECIMAL(10, 6)) AS dailyRate'),
      // lastsInDays - how long the 'quantityOnHand' lasts, in days
      knex.raw(`
        CASE
        WHEN IFNULL(ii.quantityOnHand,0) > 0 and IFNULL(rate1.rate, 0) > 0 THEN CAST(ii.quantityOnHand / rate1.rate AS SIGNED)
        ELSE NULL
        END AS lastsInDays
      `)
    )
    .union([
      query('Join Consumable with Sites which does not have inventories')
        .from('Consumable as c')
        .join('Site as s')
        .innerJoin('ConsumableAssay as cona', 'cona.consumableId', 'c.id')
        .innerJoin('Assay as asa', 'asa.id', 'cona.assayId')
        .innerJoin('DeviceType as dt', 'dt.id', 'asa.deviceTypeId')
        .innerJoin(
          function () {
            this.select('d.*')
              .from('Device as d')
              .innerJoin('Site as si', 'si.id', 'd.siteId')
              .innerJoin('DeviceType as det', 'det.id', 'd.deviceTypeId')
              .groupBy('d.siteId', 'd.deviceTypeId')
              .as('DistTable')
          },
          function () {
            this.on('DistTable.siteId', 's.id').andOn('DistTable.deviceTypeId', 'dt.id')
          }
        )
        .leftOuterJoin('InventoryItem as ii', function () {
          this.on('c.id', 'ii.consumableId').andOn('s.id', 'ii.siteId')
        })
        .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
        .leftOuterJoin('Country as co', 'g.countryId', 'co.id')
        .leftOuterJoin('State as st', 'g.stateId', 'st.id')
        .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
        .whereNull('ii.id') // means site doesn't have inventory items
        .modify(filterParams, request.query, {
          ...INVENTORY_ITEM_FILTER_FIELDS,
          hasStock: knex.raw('ii.quantityOnHand <> 0'),
        })
        .modify(addConstraints, dataConstraints, {
          ...INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
          assay: 'asa',
          device: 'DistTable',
        })
        .select(
          'c.id as consumableId',
          'c.name as consumableName',
          's.id as siteId',
          knex.raw('null as quantityOnHand'),
          knex.raw('null as expirationDate'),
          knex.raw('null as expiresInDays'),
          knex.raw('null as dailyRate'),
          knex.raw('null as lastsInDays')
        ),
    ])
  // -----------------
  // add couple of calculated fields - daysUnexpired, wasted
  const baseWithCalculatedFields = knex.from(baseInventoryItemsBySiteGeography.as('t1')).select(
    't1.*',
    knex.raw(`
      CASE
        WHEN quantityOnHand IS NULL THEN NULL
        WHEN quantityOnHand <= 0 THEN 0
        WHEN expiresInDays > lastsInDays OR expirationDate IS NULL OR dailyRate IS NULL
          THEN lastsInDays
        ELSE expiresInDays
      END AS daysUnexpired
      `),
    knex.raw(`
      CASE
        WHEN quantityOnHand IS NULL THEN NULL
        WHEN quantityOnHand <= 0 THEN 0
        WHEN expiresInDays < lastsInDays AND expirationDate IS NOT NULL
          THEN
            CASE
              WHEN expirationDate > NOW() THEN CAST(dailyRate * (lastsInDays - expiresInDays) AS SIGNED)
              ELSE quantityOnHand
            END
        ELSE 0
      END AS wasted
      `)
  )
  return baseWithCalculatedFields
}

// ----------------------------------------------------------------------------------
function getSupplyInStockBySiteAndConsumableBase(request, dataConstraints) {
  // group by siteId and consumableId, and return different counts
  const baseWithCalculatedFields = getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(request, dataConstraints)
  const supplyInStockBase = knex
    .from(baseWithCalculatedFields.as('t2'))
    .groupBy(['consumableId', 'siteId'])
    .select([...SUPPLY_IN_STOCK_FIELDS, knex.raw('MAX(daysUnexpired) as stockLeft'), 'siteId'])
  return supplyInStockBase
}

// ----------------------------------------------------------------------------------
function filteredInventoryItemsBase(request, dataConstraints) {
  const supplyInStockBase = getSupplyInStockBySiteAndConsumableBase(request, dataConstraints)

  const inventoryItemsQuery = query('Search Inventory Items')
    .from(supplyInStockBase.as('stock'))
    .innerJoin('Site as s', 'stock.siteId', 's.id')
    .innerJoin('Consumable as c', 'stock.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .leftOuterJoin('FactInventoryConsumptionRate as ficr', builder => {
      builder.on('ficr.siteId', 's.id').andOn('ficr.consumableId', 'c.id').andOn('ficr.days', 1)
    })
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      hasStock: knex.raw('ii.quantityOnHand <> 0'),
      ...STOCK_LEFT_FILTER_FIELDS,
    })
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)

  return inventoryItemsQuery
}

function getBaseUnreconciledResultsQuery() {
  return knex('Result as r')
    .innerJoin('Site as s', 'r.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .innerJoin('Consumable as c', 'ca.consumableId', 'c.id')
    .leftJoin('Site as pa', 's.parentWarehouseId', 'pa.id')
    .whereNull('r.reconciliationDate')
}

async function getReconciliationList(query, dataConstraints) {
  const partnerId = dataConstraints.partner.id
  const consumableStrategy = await getConsumableStrategy(partnerId)

  const baseQuery = getBaseUnreconciledResultsQuery()
    .modify(addConstraints, dataConstraints, { result: 'r', geography: 'g' })
    .modify(filterDateRangeParams, query, 'r.consumableExpirationDate')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      siteId: 's.id',
      assayId: 'r.assayId',
      consumableId: 'ca.consumableId',
      lotNumber: 'r.consumableLot',
    })
    .groupBy([
      's.id',
      'c.id',
      ...(query.breakOutByLot
        ? consumableStrategy.filterFields({
            lotNumberField: 'r.consumableLot',
            expiresOnField: 'r.consumableExpirationDate',
          })
        : []),
    ])
    .modify(queryBuilder => {
      if (query.siteIds) {
        queryBuilder.whereIn('s.id', query.siteIds.split(','))
      }
    })
    .count('* as quantity')

  const getItems = baseQuery
    .clone()
    .modify(sortPageParams, query, 's.name')
    .orderBy('r.id')
    .select([
      's.name as siteName',
      'c.name as consumableName',
      'c.id as consumableId',
      's.id as siteId',
      'r.assayId',
      'g.stateId',
      'g.lgaId',
      'st.name as stateName',
      'l.name as lgaName',
      ...(query.breakOutByLot
        ? consumableStrategy.filterFields({
            lotNumberField: 'r.consumableLot',
            expiresOnField: 'r.consumableExpirationDate as expiresOn',
          })
        : []),
    ])

  const getCount = knex.from(baseQuery.clone().as('q')).count('* as total').first()

  return Promise.all([getCount, getItems])
}

async function appendSiteConsumables(data) {
  const siteIds = [...new Set(data.map(it => it.siteId))]
  const items = await knex('SiteConsumable')
    .whereIn('siteId', siteIds)
    .select('siteId', knex.raw(`GROUP_CONCAT(consumableId SEPARATOR ',') as siteConsumables`))
    .groupBy('siteId')
  data.map(d => {
    const { siteId } = d
    d.siteConsumables = items.find(it => it.siteId === siteId)?.siteConsumables || ''
    d.siteConsumables = d.siteConsumables.split(',').map(x => +x)
    return d
  })
  return data
}

async function updateConsumableSitesBatch(knex, consumableId, { siteIds }) {
  // Get current sites for this consumable
  const currentSites = await knex('SiteConsumable')
    .where({ consumableId })
    .select('siteId')
    .then(rows => rows.map(row => row.siteId))

  // Find sites to add and remove
  const sitesToAdd = siteIds.filter(id => !currentSites.includes(id))
  const sitesToRemove = currentSites.filter(id => !siteIds.includes(id))

  // Check if any sites to remove have inventory or unreconciled transactions
  if (sitesToRemove.length > 0) {
    const hasInventory = await knex('InventoryItem')
      .whereIn('siteId', sitesToRemove)
      .where({ consumableId })
      .where('quantityOnHand', '>', 0)
      .first()

    if (hasInventory) {
      throw Boom.conflict('Unable to remove consumable from sites with existing inventory')
    }

    // Check for unreconciled results
    const hasUnreconciledResults = await knex('Result as r')
      .leftJoin('ConsumableAssay as ca', 'ca.assayId', 'r.assayId')
      .whereIn('r.siteId', sitesToRemove)
      .where('ca.consumableId', consumableId)
      .whereNull('r.reconciliationDate')
      .first()

    if (hasUnreconciledResults) {
      throw Boom.conflict('Unable to remove consumable from sites with unreconciled transactions')
    }
  }

  // Perform atomic batch operation
  return knex.transaction(async trx => {
    // Remove consumable from sites that are no longer selected
    if (sitesToRemove.length > 0) {
      await trx('SiteConsumable').where({ consumableId }).whereIn('siteId', sitesToRemove).del()
    }

    // Add consumable to new sites
    if (sitesToAdd.length > 0) {
      const rowsToInsert = sitesToAdd.map(siteId => ({
        siteId,
        consumableId,
      }))
      await trx('SiteConsumable').insert(rowsToInsert).onConflict(['siteId', 'consumableId']).ignore()
    }
  })
}

module.exports = {
  getBaseUnreconciledResultsQuery,
  findInventoryItem,
  getInventoryItem,
  getInventorySitesQuery,
  getInventoryLogBaseQuery,
  getInventoryBySitesAndConsumableQuery,
  getUnreconciledQuantitiesSubquery,
  getInventoryItemsBySiteGeographyWithCalculatedFieldsBase,
  filteredInventoryItemsBase,
  getInventoryTransfer,
  createInventoryTransfer,
  updateInventoryTransfer,
  getReconciliationList,
  appendSiteConsumables,
  getConsumableStrategy,
  updateConsumableSitesBatch,
}
