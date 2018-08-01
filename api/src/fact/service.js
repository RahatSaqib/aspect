const { addDays, subDays, startOfDay } = require('date-fns')
const _ = require('lodash')
const {
  inventoryStockout,
  inventoryStockExpiring,
} = require('../inventory/actions')
const {
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
} = require('./actions')

const {
  deviceOffline,
  deviceOnline,
  deviceNoResults,
  deviceHasNewResults,
} = require('../device/actions')

const daysToCalculate = [1, 7, 30, 60, 90, 365, 9999]

function onFactGenerateDeviceConnectivity({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    deviceOffline,
    deviceNoResults,
  })
  return context.run(async knex => {
    // If we don't have facts yet for devices we care about, generate them
    // with defaults values
    const now = new Date()
    const deviceNoFactsQ = knex('Device as d')
      .leftJoin('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .whereNull('f.deviceId')
      .select('d.id')
    if (deviceId != null) {
      deviceNoFactsQ.where({ 'd.id': deviceId })
    }
    const noFactDevices = await deviceNoFactsQ.map(d => ({
      deviceId: d.id,
      updatedOn: now,
    }))
    await knex.batchInsert('FactDeviceFlag', noFactDevices, 25)

    const devicesQ = knex('Device as d')
      .join('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .join('Partner as p', 'd.partnerId', 'p.id')
      // if already have connectivity flag, no reason to calculate again
      .where({ 'f.offline': 0, 'f.noResults': 0 })
      .select(
        'd.id',
        'p.maxDaysDeviceOffline',
        'p.maxDaysDeviceNoResults',
        'd.lastPingOn',
        'd.lastSeenOn',
        'd.createdOn as deviceCreatedOn',
        'f.maintenance',
        'f.maintenanceDueOn',
        knex('Result as r')
          .whereRaw('r.deviceId = d.id')
          .select(
            knex.raw('max(coalesce(r.endedOn, r.startedOn, r.updatedOn))')
          )
          .as('lastResultOn')
      )
    if (deviceId != null) {
      // constrain by single device specified by action, or query all
      // devices on schedule
      devicesQ.where({ 'd.id': deviceId })
    }
    await devicesQ.map(
      ({
        id,
        maxDaysDeviceOffline,
        maxDaysDeviceNoResults,
        lastPingOn,
        lastSeenOn,
        deviceCreatedOn,
        lastResultOn,
        maintenance,
        maintenanceDueOn,
      }) => {
        const maxLastDateOffline =
          maxDaysDeviceOffline == null
            ? null
            : subDays(now, maxDaysDeviceOffline)
        const maxLastDateNoResult =
          maxDaysDeviceNoResults == null
            ? null
            : subDays(now, maxDaysDeviceNoResults)
        // TODO move #days to partner config
        const maxMaintenanceDateNoResult = addDays(lastSeenOn, 30)

        // If we haven't seen a result, use deviceCreatedOn for checks
        if (lastResultOn == null) {
          lastResultOn = deviceCreatedOn
        }

        if (
          lastPingOn == null ||
          (maxLastDateOffline != null && lastPingOn <= maxLastDateOffline)
        ) {
          // Number of days of "heartbeat" > X days
          context.deviceOffline(id, { lastSeenOn, lastPingOn })
        } else if (
          maxLastDateNoResult != null &&
          lastResultOn <= maxLastDateNoResult
        ) {
          // OR no tests run > Y days
          context.deviceNoResults(id, { lastResultOn })
        } else if (
          maintenance === 1 &&
          maintenanceDueOn != null &&
          maxMaintenanceDateNoResult != null &&
          maintenanceDueOn >= maxMaintenanceDateNoResult
        ) {
          // OR inactive - expected back date > Z days
          context.deviceNoResults(id, { lastResultOn })
        } else if (
          maintenance === 1 &&
          maintenanceDueOn != null &&
          now > maintenanceDueOn
        ) {
          // OR date passes expected back date
          context.deviceNoResults(id, { lastResultOn })
        }
        return id // for lint
      }
    )
  })
}

function onFactGenerateResultCounts(action, context) {
  if (action.deviceId != null) {
    // specialization if device id specified, otherwise query for devices below.
    return onFactGenerateResultCountsForDevice(action, context)
  }

  const messageContext = context.messageContext.bindActionCreators({
    factGenerateResultCounts,
  })
  return messageContext.run(async knex => {
    // TODO do we really need to generate result counts for every device every hour?
    await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .select('d.id as deviceId')
      .map(({ deviceId }) => messageContext.factGenerateResultCounts(deviceId))
  })
}

function onDeviceSeen({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOnline })
  return context.run(async knex => {
    // Mark device online if seen more recently than offline
    const offlineDevice = await knex('Device as d')
      .leftJoin('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
      .where('d.id', deviceId)
      .where(function() {
        // If we don't fact yet, seen for first time, consider this online
        this.whereNull('fdf.deviceId')
          // If fact is marked offline and we've seen the device more recently
          // then the update, we are also online
          .orWhereRaw('fdf.offline = 1 and (fdf.updatedOn <= d.lastSeenOn)')
      })
      .first('d.id')
    if (offlineDevice != null) {
      context.deviceOnline(offlineDevice.id)
    }
  })
}

function onDeviceUpdateFlag(updates) {
  return ({ deviceId, options }, { messageContext }) => {
    const context = messageContext.bindActionCreators({
      factGenerateDeviceConnectivity,
    })
    return context.run(async knex => {
      const flagUpdates = Object.assign({ updatedOn: new Date() }, updates)

      if (
        updates.maintenance === 1 &&
        options != null &&
        options.dueOn != null
      ) {
        flagUpdates.maintenanceDueOn = new Date(options.dueOn)
      } else if (updates.maintenance === 0) {
        flagUpdates.maintenanceDueOn = null
      }

      const updatedRows = await knex('FactDeviceFlag')
        .where({ deviceId })
        .update(flagUpdates)
      if (updatedRows === 0) {
        // If we don't have a flag for this device yet, create it!
        await knex('FactDeviceFlag').insert(
          Object.assign({ deviceId }, flagUpdates)
        )
      }

      // flags have been updated, check connectivity again for this device with
      // updated flags in case resolved updates triggered different issue conditions
      context.factGenerateDeviceConnectivity(deviceId)
    })
  }
}

function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    factGenerateResultCounts,
    deviceHasNewResults,
  })
  return context.run(async knex => {
    const {
      deviceId,
      assayId,
      resultCategory1,
      resultCategory2,
      noResults,
    } = await knex('Result as r')
      .leftJoin('FactDeviceFlag as fdf', 'fdf.deviceId', 'r.deviceId')
      .where({ id: resultId })
      .first(
        'r.deviceId',
        'r.assayId',
        'r.resultCategory1',
        'r.resultCategory2',
        'fdf.noResults'
      )
    if (noResults === 1) {
      context.deviceHasNewResults(deviceId)
    }
    context.factGenerateResultCounts(deviceId, {
      assayId,
      resultCategory1,
      resultCategory2,
    })
  })
}

function onFactGenerateResultCountsForDevice(
  { deviceId, options = {} },
  { messageContext }
) {
  const { assayId, resultCategory1, resultCategory2 } = options
  return messageContext.transact(async knex => {
    const now = new Date()

    // query for selecting data for the device
    const query = knex('Result as r').where({ deviceId })
    query.modify(queryBuilder => {
      if (assayId) {
        queryBuilder.where({ assayId })
      }
      if (resultCategory1) {
        queryBuilder.where({ resultCategory1 })
      }
      if (resultCategory2) {
        queryBuilder.where({ resultCategory2 })
      }
    })

    for (const days of daysToCalculate) {
      /* eslint-disable no-await-in-loop */
      const endedOn = startOfDay(subDays(now, days))

      // query for selecting data for the device
      const query = knex('Result as r').whereRaw(
        'r.deviceId = :deviceId and r.endedOn > :endedOn',
        {
          deviceId,
          endedOn,
        }
      )

      // calculate by device - make sure it still exists
      const device = await knex('Device')
        .where({ id: deviceId })
        .first('deviceId')
      if (!device) {
        return
      }

      const countByDevice = await query
        .clone()
        .count('r.id as resultCount')
        .select('r.deviceId')
        .first()

      await knex.raw(
        knex('FactResultsDevice')
          .insert({
            deviceId,
            days,
            resultCount: countByDevice.resultCount,
            calculatedOn: now,
          })
          .toString()
          .replace(/^insert/i, 'replace')
      )

      // ...grouped by assay
      const countsByAssay = await query
        .clone()
        .whereNotNull('r.assayId')
        .groupBy('r.assayid')
        .count('r.id as resultCount')
        .select('r.assayId')

      for (const count of countsByAssay) {
        await knex.raw(
          knex('FactResultsDeviceByAssay')
            .insert({
              deviceId,
              assayId: count.assayId,
              days,
              resultCount: count.resultCount,
              calculatedOn: now,
            })
            .toString()
            .replace(/^insert/i, 'replace')
        )
      }

      // ...grouped by assay, resultCategory
      const countsByCategory = await query
        .clone()
        .whereNotNull('r.assayId')
        .whereNotNull('r.resultCategory1')
        .groupBy('r.assayId', 'r.resultCategory1')
        .count('r.id as resultCount')
        .select('r.assayId', 'r.resultCategory1')

      for (const count of countsByCategory) {
        await knex.raw(
          knex('FactResultsDeviceByCategory1')
            .insert({
              deviceId,
              assayId: count.assayId,
              resultCategory1: count.resultCategory1,
              days,
              resultCount: count.resultCount,
              calculatedOn: now,
            })
            .toString()
            .replace(/^insert/i, 'replace')
        )
      }

      // ...grouped by assay, resultCategory 1 & 2
      const countsByCategories = await query
        .clone()
        .whereNotNull('r.assayId')
        .whereNotNull('r.resultCategory1')
        .whereNotNull('r.resultCategory2')
        .groupBy('r.assayId', 'r.resultCategory1', 'r.resultCategory2')
        .count('r.id as resultCount')
        .select('r.assayId', 'r.resultCategory1', 'r.resultCategory2')

      for (const count of countsByCategories) {
        await knex.raw(
          knex('FactResultsDeviceByCategory1And2')
            .insert({
              deviceId,
              assayId: count.assayId,
              resultCategory1: count.resultCategory1,
              resultCategory2: count.resultCategory2,
              days,
              resultCount: count.resultCount,
              calculatedOn: now,
            })
            .toString()
            .replace(/^insert/i, 'replace')
        )
      }
      /* eslint-enable no-await-in-loop */
    }

    // delete orphan data (=not updated in the loop)
    await knex('FactResultsDevice')
      .where({ deviceId })
      .whereRaw('calculatedOn < ?', now)
      .delete()

    await knex('FactResultsDeviceByAssay')
      .where({ deviceId })
      .whereRaw('calculatedOn < ?', now)
      .modify(queryBuilder => {
        if (assayId) {
          queryBuilder.where({ assayId })
        }
      })
      .delete()

    await knex('FactResultsDeviceByCategory1')
      .where({ deviceId })
      .whereRaw('calculatedOn < ?', now)
      .modify(queryBuilder => {
        if (assayId) {
          queryBuilder.where({ assayId })
        }
        if (resultCategory1) {
          queryBuilder.where({ resultCategory1 })
        }
      })
      .delete()

    await knex('FactResultsDeviceByCategory1And2')
      .where({ deviceId })
      .whereRaw('calculatedOn < ?', now)
      .modify(queryBuilder => {
        if (assayId) {
          queryBuilder.where({ assayId })
        }
        if (resultCategory1) {
          queryBuilder.where({ resultCategory1 })
        }
        if (resultCategory2) {
          queryBuilder.where({ resultCategory2 })
        }
      })
      .delete()
  })
}

// ----------------------------------------------
// This function is triggered by scheduler, and checks stock for all sites
// ----------------------------------------------
function onFactCheckInventoryStock(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
  })

  // loop all sites and audit each consumables
  return context.run(async knex => {
    const now = new Date()

    // get list of inventory details grouped by site/consumable
    const sites = await knex('InventoryItem as ii')
      .innerJoin('Site as s', 'ii.siteId', 's.id')
      .innerJoin('Partner as p', 's.partnerId', 'p.id')
      .where(function() {
        this.whereNull('ii.expiresOn') // if is null
          .orWhere('ii.expiresOn', '>', now) // or unexpired
      })
      .groupBy('ii.siteId', 'ii.consumableId')
      .select(
        'ii.siteId',
        'ii.consumableId',
        knex.raw('MAX(p.dueDaysInventoryStockout) as dueDaysInventoryStockout'),
        knex.raw(
          'MAX(p.dueDaysInventoryStockExpiring) as dueDaysInventoryStockExpiring'
        )
      )

    // loop all sites and for each check if there are enough inventory items in stock
    _.map(sites, async site => {
      const { siteId, consumableId } = site
      // notice that 'rate' field in table FactInventoryConsumptionRate stores total number of
      // tests during corresponding 'days'. So for actual rate you should do rate/days, but
      // for days=1 use 'rate' as-is
      const { rate: dailyRate } = (await knex('FactInventoryConsumptionRate')
        .where({ siteId, consumableId, days: 1 })
        .first('rate')) || { rate: 0 }

      if (dailyRate > 0) {
        const props = {
          knex,
          site,
          dailyRate,
        }
        // Stockout
        await auditInventoryStockout({
          ...props,
          dueDays: site.dueDaysInventoryStockout,
          dispatch: context.inventoryStockout,
        })
        // Stock Expiring
        await auditInventoryStockExpiring({
          ...props,
          dueDays: site.dueDaysInventoryStockExpiring,
          dispatch: context.inventoryStockExpiring,
        })
      }
    })
  })
}

// -----------------------------
// auditInventoryStockout
// -----------------------------
async function auditInventoryStockout({
  knex,
  site: { siteId, consumableId },
  dailyRate,
  dueDays,
  dispatch,
}) {
  const days = await totalDaysUnexpiredInventoryItemsLast({
    knex,
    siteId,
    consumableId,
    dailyRate,
    dueDays,
  })

  if (days < dueDays) {
    dispatch(siteId, consumableId, days)
  }
}

// -----------------------------
// totalDaysUnexpiredInventoryItemsLast - is used also in /inventory/service.js
// -----------------------------
async function totalDaysUnexpiredInventoryItemsLast({
  knex,
  siteId,
  consumableId,
  dailyRate,
  dueDays,
}) {
  // get all un-expired inventory items for provided site/consumable
  const items = await knex('InventoryItem')
    .where(function() {
      this.whereNull('expiresOn') // if is null
        .orWhere('expiresOn', '>', new Date()) // or unexpired
    })
    .where({ siteId, consumableId })
    .select(
      'quantityOnHand',
      'expiresOn',
      knex.raw(
        `CAST(
          DATEDIFF(
            IFNULL(
              expiresOn,
              DATE_ADD(NOW(), INTERVAL ? DAY)
            ),
            NOW()
          )
          AS SIGNED INTEGER
        ) AS expiresInDays`,
        [dueDays + 1]
      )
    )

  // take into account expiration dates - calculate how long items last
  const days = _.reduce(
    items,
    (sum, item) => {
      const lastsInDays = item.quantityOnHand / dailyRate
      const lastsActual = Math.min(lastsInDays, item.expiresInDays)
      const daysLeft = lastsActual - sum
      const cntDays = Math.max(0, daysLeft)
      return sum + cntDays
    },
    0
  )

  return days
}

// -----------------------------
// auditInventoryStockExpiring
// -----------------------------
async function auditInventoryStockExpiring({
  knex,
  site: { siteId, consumableId },
  dailyRate,
  dueDays,
  dispatch,
}) {
  const totalWasted = await totalWastedInventoryItems({
    knex,
    siteId,
    consumableId,
    dailyRate,
  })

  if (totalWasted > 0) {
    dispatch(siteId, consumableId, dueDays, totalWasted)
  }
}
// -----------------------------
// totalWastedInventoryItems - is used also in /inventory/service.js
// -----------------------------
async function totalWastedInventoryItems({
  knex,
  siteId,
  consumableId,
  dailyRate,
}) {
  // get all un-expired inventory items for provided site/consumable
  const items = await knex('InventoryItem')
    .where({ siteId, consumableId })
    .whereNotNull('expiresOn') // is NOT null
    .where('expiresOn', '>', new Date()) // and unexpired
    .select(
      'quantityOnHand',
      'expiresOn',
      knex.raw(
        `CAST(GREATEST(DATEDIFF(expiresOn, NOW()), 0) AS SIGNED INTEGER) AS expiresInDays`
      )
    )

  // take into account expiration dates - calculate how long items last
  const now = new Date()
  const totalWasted = _.reduce(
    items,
    (sum, item) => {
      const lastsInDays = item.quantityOnHand / dailyRate
      const wasted =
        item.expiresInDays < lastsInDays
          ? item.expiresOn > now
            ? dailyRate * (lastsInDays - item.expiresInDays)
            : item.quantityOnHand
          : 0

      return sum + wasted
    },
    0
  )

  return totalWasted
}

// -------------------------------------------------------------------------------------
// ---
// --- functions for Inventory Consumption Rates
// ---
// -------------------------------------------------------------------------------------

// ------------------------------
// is called from scheduler
function onFactCalculateInventoryConsumptionRates(action, { messageContext }) {
  return messageContext.run(async knex => {
    const items = await knex('InventoryItem')
      .groupBy('siteId', 'consumableId')
      .select('siteId', 'consumableId')

    // loop through all sites/consumables and refresh rate
    _.map(items, async item => {
      await refreshConsumptionRates(knex, item.siteId, item.consumableId)
    })
  })
}
// ------------------------------
// recalculates rates for provided siteId and consumableId
async function refreshConsumptionRates(knex, siteId, consumableId) {
  const updatedOn = new Date()
  const totals = await getConsumptions(knex, siteId, consumableId)
  _.map(totals, async x => {
    await knex.raw(
      knex('FactInventoryConsumptionRate')
        .insert({
          siteId,
          consumableId,
          days: x.days,
          // in GxAlert we stored totals in field 'rate', so same here.
          // to get actual rate - do rate/days
          rate: x.total,
          updatedOn,
        })
        .toString()
        .replace(/^insert/i, 'replace')
    )
  })
  return totals
}

async function getConsumptions(knex, siteId, consumableId) {
  const totals = []
  // --------------------
  // daily rate -
  // use most recent N days with at least one test
  // --------------------
  const limitItems = 10
  const lastDaysWithTest = await knex
    .from(function() {
      this.from('Result as r')
        .innerJoin('Assay as a', 'r.assayId', 'a.id')
        .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .where('d.siteId', siteId)
        .where('ca.consumableId', consumableId)
        .distinct(knex.raw('date(r.endedOn) as endedOn'))
        .orderBy('endedOn', 'desc')
        .limit(limitItems)
        .as('t1')
    })
    .first(
      knex.raw('min(endedOn) as dateFrom'),
      knex.raw('max(endedOn) as dateTo')
    )

  if (!lastDaysWithTest) {
    return totals
  }

  const [consumed = { total: 0 }] =
    (await knex('Result as r')
      .innerJoin('Assay as a', 'r.assayId', 'a.id')
      .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
      .innerJoin('Device as d', 'r.deviceId', 'd.id')
      .whereRaw('date(r.endedOn) >= ?', [lastDaysWithTest.dateFrom])
      .whereRaw('date(r.endedOn) <= ?', [lastDaysWithTest.dateTo])
      .where('d.siteId', siteId)
      .where('ca.consumableId', consumableId)
      .sum('ca.quantity as total')
      .groupBy('d.siteId', 'ca.consumableId')) || []

  totals.push({ days: 1, total: consumed.total / limitItems })

  // --------------------
  // other rates
  // --------------------
  const daysToRate = daysToCalculate.filter(x => x > 1 && x < 9999)
  const fields = _.map(daysToRate, days =>
    knex.raw(
      `sum(case when r.endedOn >= DATE_ADD(CURDATE(), INTERVAL  -${days} DAY) then ca.quantity else 0 end) as total${days}`
    )
  )

  const consumedTotals = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .whereRaw('r.endedOn >= DATE_ADD(CURDATE(), INTERVAL -1 YEAR)')
    .where('d.siteId', siteId)
    .where('ca.consumableId', consumableId)
    .groupBy('d.siteId', 'ca.consumableId')
    .first(...fields)

  _.map(daysToRate, days => {
    const totalItems = consumedTotals && consumedTotals[`total${days}`]
    const total = _.isNumber(totalItems) ? totalItems : 0
    totals.push({ days, total })
  })

  return totals
}

module.exports = {
  daysToCalculate,
  onFactGenerateDeviceConnectivity,
  onFactGenerateResultCounts,
  onFactCheckInventoryStock,
  onFactCalculateInventoryConsumptionRates,
  onDeviceSeen,
  onDeviceUpdateFlag,
  onResultLogged,
  refreshConsumptionRates,
  totalDaysUnexpiredInventoryItemsLast,
  totalWastedInventoryItems,
}
