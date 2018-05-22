const { subDays } = require('date-fns')
const _ = require('lodash')
const {
  inventoryStockout,
  inventoryStockExpiring,
} = require('../inventory/actions')
const { factGenerateResultCounts } = require('./actions')
const {
  deviceOffline,
  deviceOnline,
  deviceNoResults,
  deviceHasNewResults,
} = require('../device/actions')

const DAYS_1 = 1
const DAYS_7 = 7
const DAYS_30 = 30
const DAYS_60 = 60
const DAYS_90 = 90
const DAYS_365 = 365
const DAYS_BIG = 9999
const daysToCalculate = [
  DAYS_1,
  DAYS_7,
  DAYS_30,
  DAYS_60,
  DAYS_90,
  DAYS_365,
  DAYS_BIG,
]

function onFactGenerateDeviceConnectivity({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    deviceOffline,
    deviceNoResults,
  })
  return context.run(async knex => {
    const devicesQ = knex('Device as d')
      .join('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .join('Partner as p', 'd.partnerId', 'p.id')
      .where({ 'f.offline': 0, 'f.noResults': 0 })
      .select(
        'd.id',
        'p.maxDaysDeviceOffline',
        'p.maxDaysDeviceNoResults',
        'd.lastPingOn',
        'd.createdOn as deviceCreatedOn',
        knex('DeviceLog as dl')
          .whereRaw('dl.deviceId = d.id')
          .whereNotNull('dl.resultId')
          .max('dl.createdOn')
          .as('lastResultOn')
      )
    if (deviceId != null) {
      devicesQ.where({ 'd.id': deviceId })
    }
    await devicesQ.map(
      ({
        id,
        maxDaysDeviceOffline,
        maxDaysDeviceNoResults,
        lastPingOn,
        deviceCreatedOn,
        lastResultOn,
      }) => {
        const now = new Date()
        const maxLastDateOffline = subDays(now, maxDaysDeviceOffline)
        const maxLastDateNoResult = subDays(now, maxDaysDeviceNoResults)
        if (lastPingOn == null || lastPingOn <= maxLastDateOffline) {
          context.deviceOffline(id)
        } else if (
          (lastResultOn != null && lastResultOn <= maxLastDateNoResult) ||
          (lastResultOn == null && deviceCreatedOn <= maxLastDateNoResult)
        ) {
          context.deviceNoResults(id)
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

function onDeviceSeen({ deviceId, dateSeen }, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOnline })
  return context.run(async knex => {
    const getDeviceAndFactDeviceFlag = async deviceId =>
      knex('Device as d')
        .leftJoin('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
        .where('d.id', deviceId)
        .first('d.id', 'fdf.deviceId', 'd.lastSeenOn', 'fdf.offline')
    let deviceAndFactDeviceFlag = await getDeviceAndFactDeviceFlag(deviceId)
    if (deviceAndFactDeviceFlag) {
      if (!deviceAndFactDeviceFlag.deviceId) {
        await knex('FactDeviceFlag').insert({ deviceId, updatedOn: new Date() })
        deviceAndFactDeviceFlag = await getDeviceAndFactDeviceFlag(deviceId)
      }
      if (
        deviceAndFactDeviceFlag.offline &&
        (!dateSeen || deviceAndFactDeviceFlag.lastSeenOn < dateSeen)
      ) {
        context.deviceOnline(deviceId)
      }
    }
  })
}

function onDeviceUpdateFlag(updates) {
  return ({ deviceId }, { messageContext }) =>
    messageContext.run(async knex =>
      knex('FactDeviceFlag')
        .where({ deviceId })
        .update(updates)
    )
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
      const endedOn = subDays(now, days)

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

async function auditInventoryStock(site, dueDays, dispatch) {
  const {
    siteId,
    consumableId,
    maxQuantityPerAssay,
    totalInStock,
    // these after GROUP_CONCAT
    csvRate,
    csvDays,
  } = site
  const arrRate = csvRate ? csvRate.split(',') : []
  const arrDays = csvDays ? csvDays.split(',') : []
  const index = _.findIndex(arrDays, x => +x === dueDays)
  const rate = index >= 0 ? arrRate[index] : null
  if (
    rate && // skip if no rate
    rate > 0 && // or rate is 0
    maxQuantityPerAssay > 0 // just in case - check this to not be 0
  ) {
    const days = totalInStock / (maxQuantityPerAssay * rate)
    if (days < dueDays) {
      dispatch(siteId, consumableId, days)
    }
  }
}

// ----------------------------------------------
// This function is triggered by scheduler, and checks stock for all sites
// ----------------------------------------------
function onFactCheckInventoryStock(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
  })

  // helper
  function normalizeDays(value, defaultValue) {
    return !_.isFinite(value)
      ? defaultValue
      : daysToCalculate.includes(value) ? value : defaultValue
  }

  return context.run(async knex => {
    const now = new Date()

    // get list of inventory details grouped by site/consumable
    const sites = await knex('InventoryItem as ii')
      .innerJoin('Site as s', 'ii.siteId', 's.id')
      .innerJoin('Partner as p', 's.partnerId', 'p.id')
      .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
      .innerJoin('ConsumableAssay as ca', 'c.id', 'ca.consumableId')
      .leftOuterJoin('FactInventoryConsumptionRate as icr', () => {
        this.on('ii.siteId', 'icr.siteId').on(
          'ii.consumableId',
          'icr.consumableId'
        )
      })
      .where('ii.expiresOn', '>', now) // take only unexpired
      .groupBy('ii.siteId', 'ii.consumableId')
      .select(
        'ii.siteId',
        'ii.consumableId',
        'max(p.dueDaysInventoryStockout) as dueDaysInventoryStockout',
        'max(p.dueDaysInventoryStockExpiring) as dueDaysInventoryStockExpiring',
        // take max value of 'consumables per assay' for projection
        'max(ca.quantity) as maxQuantityPerAssay',
        // how many items are on hand
        'sum(ii.quantityOnHand) as totalInStock',
        // consumption rate
        knex.raw("GROUP_CONCAT(icr.rate SEPARATOR ',') as csvRate"),
        knex.raw("GROUP_CONCAT(icr.days SEPARATOR ',') as csvDays")
      )

    // loop all sites and for each check if there are enough inventory items in stock
    _.map(sites, async site => {
      // ----------------
      // for each site/consumable - project for how long stock is okay
      // ----------------
      await auditInventoryStock(
        site,
        normalizeDays(+site.dueDaysInventoryStockout, DAYS_30),
        context.inventoryStockout
      )
      await auditInventoryStock(
        site,
        normalizeDays(+site.dueDaysInventoryStockExpiring, DAYS_7),
        context.inventoryStockExpiring
      )
    })
    // all set
  })
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
      refreshConsumptionRates(knex, item.siteId, item.consumableId)
    })
  })
}
// ------------------------------
// recalculates rates for provided siteId and consumableId
async function refreshConsumptionRates(knex, siteId, consumableId) {
  const updatedOn = new Date()
  const consumedTotals = getConsumedTotals(knex, siteId, consumableId)

  _.map(daysToCalculate.filter(x => x > 1), async days => {
    // calculate rate
    const totalItems = consumedTotals[`total${days}`]
    const rate = totalItems ? totalItems / days : 0

    // insert/update rate in db
    await knex.raw(
      knex('FactInventoryConsumptionRate')
        .insert({
          siteId,
          consumableId,
          days,
          rate,
          updatedOn,
        })
        .toString()
        .replace(/^insert/i, 'replace')
    )
  })
}
// ------------------------------
// returns object with numbers of used consumables in format
// { totalNNN: NUMERIC_VALUE, ... }
// where NNN is number from array daysToCalculate (see top of this file), i.e
// {
//   total7: xxx,
//   total30: yyy,
//   total60: zzz,
//   etc
// }
async function getConsumedTotals(knex, siteId, consumableId) {
  // --------------------
  // get total consumed items for
  // most recent 7 days with at least one test
  // --------------------
  const lastDaysWithTest = await knex
    .from(
      knex('Result as r')
        .innerJoin('Assay as a', 'r.assayId', 'a.id')
        .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .where('d.siteId', siteId)
        .where('ca.consumableId', consumableId)
        .orderBy('r.endedOn')
        .distinct('date(r.endedOn) as endedOn')
        .select('date(r.endedOn) as endedOn')
        .limit(DAYS_7)
    )
    .first('min(endedOn) as dateFrom', 'max(endedOn) as dateTo')

  const consumed7 = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .where('date(r.endedOn)', '>=', lastDaysWithTest.dateFrom)
    .where('date(r.endedOn)', '<=', lastDaysWithTest.dateTo)
    .where('d.siteId', siteId)
    .where('ca.consumableId', consumableId)
    .groupBy('d.siteId', 'ca.consumableId')
    .sum(`ca.quantity as total${DAYS_7}`)

  // --------------------
  // get total consumed items for all periods greater than 7 days
  // --------------------
  const fields = []
  _.map(daysToCalculate.filter(x => x > DAYS_7), async days => {
    let calcField
    if (days === DAYS_BIG) {
      calcField = knex.raw(`sum(ca.quantity) as total${days}`)
    } else {
      const interval = days === DAYS_365 ? `-1 YEAR` : `-${days} DAY`
      calcField = knex.raw(
        `sum(case when r.endedOn >= DATE_ADD(CURDATE(), INTERVAL ${interval}) then ca.quantity else 0 end) as total${days}`
      )
    }
    fields.push(calcField)
  })
  const consumedRest = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .where('r.endedOn', '>=', `DATE_ADD(CURDATE(), INTERVAL ${DAYS_BIG})`)
    .where('d.siteId', siteId)
    .where('ca.consumableId', consumableId)
    .groupBy('d.siteId', 'ca.consumableId')
    .first(...fields)

  return { ...consumed7, ...consumedRest }
}

module.exports = {
  daysToCalculate,
  DAYS_1,
  DAYS_7,
  DAYS_30,
  DAYS_60,
  DAYS_90,
  DAYS_365,
  DAYS_BIG,
  onFactGenerateDeviceConnectivity,
  onFactGenerateResultCounts,
  onFactCheckInventoryStock,
  onFactCalculateInventoryConsumptionRates,
  onDeviceSeen,
  onDeviceUpdateFlag,
  onResultLogged,
}
