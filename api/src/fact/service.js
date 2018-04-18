const { subDays } = require('date-fns')
const _ = require('lodash')
const { factGenerateResultCountsForDevice } = require('./actions')
const { deviceOffline, deviceOnline } = require('../device/actions')

function onFactGenerateDeviceOffline(action, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOffline })
  context.run(async knex => {
    const devices = await knex('Device as d')
      .join('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .select('d.id', 'd.partnerId', 'd.lastPingOn')
      .where({ 'f.offline': false })
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
  context.run(async knex => {
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
  context.run(async knex => {
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

function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    factGenerateResultCountsForDevice,
  })
  context.run(async knex => {
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
  messageContext.run(async knex => {
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
  })
}

module.exports = {
  onFactGenerateDeviceOffline,
  onFactGenerateResultCounts,
  onFactGenerateResultCountsForDevice,
  onDeviceSeen,
  onDeviceOffline,
  onDeviceOnline,
  onResultLogged,
}
