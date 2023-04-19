const subDays = require('date-fns/subDays')
const _ = require('lodash')

const { knex, filterDateRangeParams, query, filterParams, sortPageParams } = require('../../db')
const {
  INVENTORY_ITEM_SELECT,
  INVENTORY_ITEM_FILTER_FIELDS,
  SUM_STOCK_LEFT_FILTER_FIELDS,
  INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES,
  INVENTORY_LOG_LIST,
  INVENTORY_LOG_SORT_FIELDS,
  INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS,
  CONCATENATED_ID,
  INVENTORY_ITEM_SORT_FIELDS,
  STOCK_LEFT_FILTER_FIELDS,
  SUPPLY_IN_STOCK_FIELDS,
} = require('./querySelectors')
const { addConstraints } = require('../../auth/constraints')
const { parseDateOrDefault } = require('../../shared/date')
const consumableStrategyModifier = require('./consumableStrategyModifier')

// ----------------------------------------------------------------------------------
async function getConsumableStrategy(consumableId) {
  let { strategy } = await knex('Consumable').where({ id: consumableId }).first('strategy')
  strategy = _.trim(strategy)
  const isLookingAsArray = _.startsWith(strategy, '[') && _.endsWith(strategy, ']')
  const strategyJson = isLookingAsArray ? JSON.parse(strategy) : [strategy]
  const consumableStrategy = _.reduce(
    strategyJson,
    (acc, name) => {
      const handler = consumableStrategyModifier[name]
      if (handler) {
        acc = [...acc, { name, handler }]
      }
      return acc
    },
    // {}
    []
  )
  return consumableStrategy
}

// ----------------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------------
function getInventoryItemsRawQuery() {
  const fldExpiresOn = `DATE_FORMAT(IFNULL(ii.expiresOn, NOW()), '%Y-%m-%d')`
  const fldQuantity = `CAST(IFNULL(ii.quantityOnHand, 0) AS CHAR(10))`
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

// ----------------------------------------------------------------------------------
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
      'c.i18nKey as consumableNameI18nKey',
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

// ----------------------------------------------------------------------------------
async function findInventoryItem(siteId, consumableId, expiresOn, lotNumber, inTransitFromSiteId) {
  const matchingInventoryItemsQuery = baseInventoryQuery(siteId, consumableId, inTransitFromSiteId)
  const consumableStrategy = await getConsumableStrategy(consumableId)

  if (consumableStrategy) {
    consumableStrategy.forEach(({ handler }) => {
      handler(matchingInventoryItemsQuery, { lotNumber, expiresOn })
    })
  }

  const matchingInventoryItem = await matchingInventoryItemsQuery.first(INVENTORY_ITEM_SELECT)
  return matchingInventoryItem
}

// ----------------------------------------------------------------------------------
const getInventoryLogBaseQuery = (knex, dataConstraints) =>
  knex('InventoryLog as il')
    .innerJoin('Consumable as c', 'il.consumableId', 'c.id')
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
async function getInventoryLog(query, dataConstraints, querySelector = INVENTORY_LOG_LIST) {
  if (_.isNil(query.maxDate)) {
    query.maxDate = new Date()
  }
  if (_.isNil(query.minDate)) {
    query.minDate = subDays(new Date(query.maxDate), 30).toISOString()
  }

  const inventoryLogQuery = getInventoryLogBaseQuery(knex, dataConstraints)
    .modify(filterDateRangeParams, query, 'il.createdOn')
    .modify(
      filterDateRangeParams,
      { minDate: query.minExpirationDate, maxDate: query.maxExpirationDate },
      'il.expiresOn'
    )
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      consumableId: 'c.id',
      consumableExternalId: 'c.externalId',
      siteName: 's.name',
      siteId: 's.id',
      lotNumber: 'il.lotNumber',
    })
    .modify(queryBuilder => {
      if (query.onlyTransfers)
        queryBuilder.whereIn('cr.i18nKey', ['ConsumableReason_TransferReceived', 'ConsumableReason_TransferSent'])
    })
  const { total } = await inventoryLogQuery.clone().count('il.id as total').first()

  const data = await inventoryLogQuery
    .select(querySelector)
    .modify(sortPageParams, query, 'il.createdOn', INVENTORY_LOG_SORT_FIELDS)
  return { data, total }
}

// ----------------------------------------------------------------------------------
function getInventoryLots(request, dataConstraints) {
  const inventoryItemsQuery = query('Search Inventory Lots')
    .from('Site as s')
    .innerJoin('Consumable as c')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('InventoryItem as ii', builder => {
      builder.on('s.id', 'ii.siteId').andOn('c.id', 'ii.consumableId')
    })
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .modify(filterDateRangeParams, request.query, 'ii.expiresOn')
    .modify(filterParams, request.query, {
      ...INVENTORY_ITEM_FILTER_FIELDS,
      ...SUM_STOCK_LEFT_FILTER_FIELDS,
    })
    .modify(addConstraints, dataConstraints, INVENTORY_ITEM_DATA_CONSTRAINT_ALIASES)
    .groupBy([
      knex.raw(CONCATENATED_ID),

      's.name',
      knex.raw(`CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN ii.lotNumber ELSE null END`),
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN ii.expiresOn ELSE null END`
      ),
      'ii.inTransitFromSiteId',
    ])
    .select(
      ...INVENTORY_ITEM_LOT_SELECT_LIST_FIELDS,
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN TRUE ELSE FALSE END AS showLot`
      ),
      knex.raw(
        `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN TRUE ELSE FALSE END AS showExpirationDate`
      )
    )

  return inventoryItemsQuery
}

// ----------------------------------------------------------------------------------
async function getInventoryByLot(request, requestQuery, dataConstraints) {
  const inventoryQuery = getInventoryLots(request, dataConstraints)

  const getCount = knex.from(inventoryQuery.clone().as('q')).count({ count: 'q.id' }).first()

  const getItems = inventoryQuery
    .clone()
    .modify(sortPageParams, requestQuery, INVENTORY_ITEM_SORT_FIELDS.siteName, INVENTORY_ITEM_SORT_FIELDS)

  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  return { total, data }
}

// ----------------------------------------------------------------------------------
function getGeneXpertInventoryBySitesAndConsumableQuery(request, dataConstraints, range, columns = '*') {
  const inventoryQuery = getInventorySitesQuery(dataConstraints, request)
    .innerJoin('ConsumableAssay as ca', 'c.id', 'ca.consumableId')
    .innerJoin('Assay as a', 'ca.assayId', 'a.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .modify(filterParams, request.query, {
      assayId: 'a.id',
    })
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
    .select(columns)
}

// ----------------------------------------------------------------------------------
async function getInventoryBySitesAndConsumable(request, dataConstraints, range) {
  let inventoryQuery = getGeneXpertInventoryBySitesAndConsumableQuery(request, dataConstraints, range)

  const [{ total }] = await inventoryQuery.clone().count('id as total')

  // sorting and pagination
  inventoryQuery = inventoryQuery.modify(sortPageParams, request.query, 'siteName')

  const inventorySites = await inventoryQuery

  return { data: inventorySites, total }
}

// ----------------------------------------------------------------------------------
function getInventoryItem(inventoryItemId) {
  return query('Get Inventory Item')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .where('ii.id', inventoryItemId)
    .first(INVENTORY_ITEM_SELECT)
}

// ----------------------------------------------------------------------------------
async function getInventoryItems(inventoryItemIds) {
  if (_.isEmpty(inventoryItemIds)) {
    return Promise.resolve([])
  }
  return query('Get Inventory Item')
    .from('InventoryItem as ii')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Site as itfs', 'ii.inTransitFromSiteId', 'itfs.id')
    .whereIn('ii.id', inventoryItemIds)
    .select(INVENTORY_ITEM_SELECT)
}

// ----------------------------------------------------------------------------------
async function updateInventoryItem(knex, inventoryItemId, inventoryItemValues) {
  const updateValues = {}
  if (typeof inventoryItemValues.expiresOn !== 'undefined') {
    updateValues.expiresOn = inventoryItemValues.expiresOn ? parseDateOrDefault(inventoryItemValues.expiresOn) : null
  }
  if (typeof inventoryItemValues.lotNumber !== 'undefined') {
    updateValues.lotNumber = inventoryItemValues.lotNumber
  }
  if (typeof inventoryItemValues.siteId !== 'undefined') {
    updateValues.siteId = inventoryItemValues.siteId
  }
  if (typeof inventoryItemValues.quantityOnHand !== 'undefined') {
    updateValues.quantityOnHand = inventoryItemValues.quantityOnHand
  }
  updateValues.updatedOn = new Date()
  if (typeof inventoryItemValues.updatedBy !== 'undefined') {
    updateValues.updatedBy = inventoryItemValues.updatedBy
  }

  return knex('InventoryItem').where('id', inventoryItemId).update(updateValues)
}

// ----------------------------------------------------------------------------------
async function insertInventoryItem(knex, inventoryItemValues) {
  const insertValues = {}
  if (typeof inventoryItemValues.consumableId !== 'undefined') {
    insertValues.consumableId = inventoryItemValues.consumableId
  }
  if (typeof inventoryItemValues.inTransitFromSiteId !== 'undefined') {
    insertValues.inTransitFromSiteId = inventoryItemValues.inTransitFromSiteId
  }
  if (typeof inventoryItemValues.siteId !== 'undefined') {
    insertValues.siteId = inventoryItemValues.siteId
  }
  if (typeof inventoryItemValues.lotNumber !== 'undefined') {
    insertValues.lotNumber = inventoryItemValues.lotNumber
  }
  if (typeof inventoryItemValues.expiresOn !== 'undefined') {
    insertValues.expiresOn = inventoryItemValues.expiresOn ? parseDateOrDefault(inventoryItemValues.expiresOn) : null
  }
  if (typeof inventoryItemValues.quantityOnHand !== 'undefined') {
    insertValues.quantityOnHand = inventoryItemValues.quantityOnHand
  }
  if (typeof inventoryItemValues.updatedOn !== 'undefined') {
    insertValues.updatedOn = inventoryItemValues.updatedOn
  }
  if (typeof inventoryItemValues.updatedBy !== 'undefined') {
    insertValues.updatedBy = inventoryItemValues.updatedBy
  }
  if (typeof inventoryItemValues.createdOn !== 'undefined') {
    insertValues.createdOn = inventoryItemValues.createdOn
  }
  if (typeof inventoryItemValues.createdBy !== 'undefined') {
    insertValues.createdBy = inventoryItemValues.createdBy
  }
  const newInventoryItem = await knex('InventoryItem').insert(insertValues)
  return newInventoryItem
}

// ----------------------------------------------------------------------------------
async function logInventoryChange({
  knex,
  inventoryItemId,
  consumableId,
  siteId,
  referencedSiteId,
  consumableReasonId,
  resultId,
  lotNumber,
  expiresOn,
  quantity,
  operation,
  notes,
  adjustedFrom,
  adjustedTo,
  createdOn,
  createdBy,
  isAutomatic,
}) {
  await knex('InventoryLog').insert({
    inventoryItemId,
    consumableId,
    siteId,
    referencedSiteId,
    consumableReasonId,
    resultId,
    lotNumber,
    expiresOn: parseDateOrDefault(expiresOn) || null,
    quantity,
    operation,
    notes,
    adjustedFrom,
    adjustedTo,
    createdOn,
    createdBy,
    isAutomatic,
  })
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

module.exports = {
  findInventoryItem,
  updateInventoryItem,
  insertInventoryItem,
  getInventoryItem,
  getInventoryItems,
  getInventorySitesQuery,
  getInventoryLogBaseQuery,
  getInventoryLog,
  getInventoryLots,
  getInventoryByLot,
  getInventoryBySitesAndConsumable,
  getGeneXpertInventoryBySitesAndConsumableQuery,
  logInventoryChange,
  getConsumableStrategy,
  getInventoryItemsBySiteGeographyWithCalculatedFieldsBase,
  filteredInventoryItemsBase,
}
