const { subDays } = require('date-fns')
const _ = require('lodash')
const { factGenerateResultCountsForDevice } = require('./actions')
const { deviceOffline, deviceOnline } = require('../device/actions')
const {
  inventoryStockout,
  inventoryStockExpiring,
} = require('../inventory/actions')

function onFactGenerateDeviceOffline(action, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOffline })
  return context.run(async knex => {
    const devices = await knex('Device as d')
      .join('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .select('d.id', 'd.partnerId', 'd.lastPingOn')
      .where({ 'f.offline': 0 })
      .orderBy('d.partnerId')

    let lastPartnerId
    let deviceMaxDaysOffline
    await Promise.all(
      _.map(devices, async ({ id, partnerId, lastPingOn }) => {
        if (lastPartnerId !== partnerId) {
          deviceMaxDaysOffline = await knex('Partner')
            .where('id', partnerId)
            .pluck('maxDaysDeviceOffline')
          lastPartnerId = partnerId
        }
        const maxLastDateOffline = subDays(new Date(), deviceMaxDaysOffline)

        if (lastPingOn <= maxLastDateOffline || lastPingOn === null) {
          context.deviceOffline(id)
        }
      })
    )
  })
}

function onFactGenerateResultCounts(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    factGenerateResultCountsForDevice,
  })
  return context.run(async knex => {
    // TODO do we really need to generate result counts for every device every hour?
    await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .select('d.id as deviceId')
      .map(({ deviceId }) =>
        context.factGenerateResultCountsForDevice(deviceId)
      )
  })
}

function onDeviceSeen({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOnline })
  return context.run(async knex => {
    const isOffline = await knex('FactDeviceFlag')
      .where({ deviceId, offline: 1 })
      .first('offline')
    if (isOffline != null) {
      context.deviceOnline(deviceId)
    }
  })
}

function onDeviceOffline({ deviceId }, { messageContext }) {
  return messageContext.run(async knex => {
    await knex('FactDeviceFlag')
      .where({ deviceId })
      .update({ offline: 1 })
  })
}

function onDeviceOnline({ deviceId }, { messageContext }) {
  return messageContext.run(async knex => {
    await knex('FactDeviceFlag')
      .where({ deviceId })
      .update({ offline: 0 })
  })
}

function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    factGenerateResultCountsForDevice,
  })
  return context.run(async knex => {
    const { deviceId, assayId, resultCategory1 } = await knex('Result')
      .where({ id: resultId })
      .first('deviceId', 'assayId', 'resultCategory1')
    context.factGenerateResultCountsForDevice(
      deviceId,
      assayId,
      resultCategory1
    )
  })
}

function onFactGenerateResultCountsForDevice(
  { deviceId, assayId, resultCategory1 },
  { messageContext }
) {
  const daysToCalculate = [1, 7, 30, 60, 90, 365, null]

  const devId = deviceId
  return messageContext.transact(async knex => {
    for (const days of daysToCalculate) {
      /* eslint-disable no-await-in-loop */
      // empty facts table for that day so we don't have dupes:
      // if assay or result category was passed in, delete only the matching records
      await knex('FactResultCountDevice')
        .where('deviceId', devId)
        .andWhere({ days })
        .andWhereRaw(
          '(assayId is null or assayId = :assayId or :assayId = -1)',
          {
            assayId: assayId || -1,
          }
        )
        .andWhereRaw(
          '(resultCategory1 is null or resultCategory1 = :rc or :rc = -1)',
          {
            rc: resultCategory1 || -1,
          }
        )
        .delete()

      const now = new Date()

      // query for selecting data for the device
      const resultCountQuery = knex('Result as r').whereRaw(
        'r.deviceId = :deviceId and r.endedOn > :endedOn',
        {
          deviceId: devId,
          endedOn: subDays(now, days || 9999),
        }
      )

      // calculate by device
      const resultCountsByDevice = await resultCountQuery
        .clone()
        .groupBy('r.deviceId')
        .select(
          knex.raw(
            `r.deviceId, null as assayId, null as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
            { days, now }
          )
        )
      await knex.from('FactResultCountDevice').insert(resultCountsByDevice)

      // ...grouped by assay
      const resultCountsByAssay = await resultCountQuery
        .clone()
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId: assayId || -1,
        })
        .groupBy('r.assayid')
        .select(
          knex.raw(
            `r.deviceId, r.assayId as assayId, null as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
            { days, now }
          )
        )
      await knex.from('FactResultCountDevice').insert(resultCountsByAssay)

      // ...grouped by assay, resultCategory
      const resultCountsByAssayAndResultCategory = await resultCountQuery
        .clone()
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId: assayId || -1,
        })
        .andWhereRaw('(resultCategory1 = :rc or :rc = -1)', {
          rc: resultCategory1 || -1,
        })
        .groupBy('r.assayid', 'r.resultCategory1')
        .select(
          knex.raw(
            `r.deviceId, r.assayId as assayId, r.resultCategory1 as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
            { days, now }
          )
        )
      await knex
        .from('FactResultCountDevice')
        .insert(resultCountsByAssayAndResultCategory)
      /* eslint-enable no-await-in-loop */
    }
  })
}

async function auditInventoryStock(site, dueDays, dispatch) {
  const {
    siteId,
    consumableId,
    maxQuantityPerAssay,
    totalInStock,
    dailyRate,
  } = site

  if (
    dailyRate && // no sense to project if rate is unknown
    dailyRate > 0 && // or is 0
    maxQuantityPerAssay > 0 // just in case - check this to not be 0
  ) {
    const days = totalInStock / (maxQuantityPerAssay * dailyRate)
    if (days < dueDays) {
      await dispatch(siteId, consumableId, days)
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
  // we do not write db here - so use 'run'
  // (MQ only writes to db)
  return context.run(async knex => {
    const now = new Date()

    // get list of inventory details grouped by site/consumable
    const sites = await knex('InventoryItem as ii')
      .innerJoin('Site as s', 'ii.siteId', 's.id')
      .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
      .innerJoin('ConsumableAssay as ca', 'c.id', 'ca.consumableId')
      .leftOuterJoin('InventoryConsumptionRate as icr', () => {
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
        // take max value of 'consumables per assay' for projection
        'max(ca.quantity) as maxQuantityPerAssay',
        // how many items are on hand
        'sum(ii.quantityOnHand) as totalInStock',
        // consumption rates
        'icr.dailyRate',
        'icr.monthlyRate'
      )

    const { inventoryConfig: { daysDue } } = require('../config')

    // loop all sites and for each check if there are enough inventory items in stock
    await Promise.all(
      _.map(sites, async site => {
        // ----------------
        // for each site/consumable - project for how long stock is okay
        // ----------------
        await auditInventoryStock(
          site,
          daysDue.stockout,
          context.inventoryStockout
        )
        await auditInventoryStock(
          site,
          daysDue.expiring,
          context.inventoryStockExpiring
        )
      })
    )
    // all set
  })
}

module.exports = {
  onFactGenerateDeviceOffline,
  onFactGenerateResultCounts,
  onFactGenerateResultCountsForDevice,
  onFactCheckInventoryStock,
  onDeviceSeen,
  onDeviceOffline,
  onDeviceOnline,
  onResultLogged,
}
