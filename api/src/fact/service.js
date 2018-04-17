const { subDays } = require('date-fns')
const _ = require('lodash')
const { deviceOffline, deviceOnline } = require('../device/actions')

function onFactGenerateDeviceOffline(action, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOffline })
  context.run(async knex => {
    await synthDeviceOfflineOnSchedule(context, knex)
  })
}

function onFactGenerateResultCounts(action, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOffline })

  context.transact(async knex => {
    await calculateResultCountsOnSchedule(context, knex)
  })
}

function onDeviceSeen({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOnline })
  messageContext.run(async knex => {
    const isOffline = await knex('FactDeviceFlag')
      .where({ deviceId, offline: true })
      .first('offline')
    if (isOffline != null) {
      context.deviceOnline(deviceId)
    }
  })
}

function onDeviceOffline({ deviceId }, { messageContext }) {
  messageContext.transact(async knex => {
    await knex('FactDeviceFlag')
      .where({ deviceId })
      .update({ offline: true })
  })
}

function onDeviceOnline({ deviceId }, { messageContext }) {
  messageContext.transact(async knex => {
    await knex('FactDeviceFlag')
      .where({ deviceId })
      .update({ offline: false })
  })
}

async function calculateResultCountsOnSchedule(context, knex) {
  await calculateResultCounts(null, null, null, knex)
}

async function synthDeviceOfflineOnSchedule(context, knex) {
  const devices = await knex
    .select('id', 'partnerId', 'lastPingOn')
    .from('Device')
    .orderBy('partnerId')

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
}

async function calculateResultCounts(deviceId, assayId, resultCategory1, knex) {
  const daysToCalculate = [1, 7, 30, 60, 90, 365, null]

  let deviceIds = [deviceId]

  // if device ID wasn't passed, calculate for all devices
  if (!deviceId) {
    deviceIds = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .pluck('d.id')
  }

  for (const devId of deviceIds) {
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
            `r.deviceId, null as AssayId, null as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
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
            `r.deviceId, r.assayId as AssayId, null as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
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
            `r.deviceId, r.assayId as AssayId, r.resultCategory1 as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
            { days, now }
          )
        )
      await knex
        .from('FactResultCountDevice')
        .insert(resultCountsByAssayAndResultCategory)
      /* eslint-enable no-await-in-loop */
    }
  }
  return { ok: true }
}

module.exports = {
  onFactGenerateDeviceOffline,
  onFactGenerateResultCounts,
  onDeviceSeen,
  onDeviceOffline,
  onDeviceOnline,
  calculateResultCounts,
}
