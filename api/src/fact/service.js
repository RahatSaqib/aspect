const { subDays } = require('date-fns')
const _ = require('lodash')
const { factGenerateResultCountsForDevice } = require('./actions')
const { deviceOffline, deviceOnline } = require('../device/actions')

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
    const { deviceId, assayId, resultCategory1, resultCategory2 } = await knex(
      'Result'
    )
      .where({ id: resultId })
      .first('deviceId', 'assayId', 'resultCategory1', 'resultCategory2')
    context.factGenerateResultCountsForDevice(
      deviceId,
      assayId,
      resultCategory1,
      resultCategory2
    )
  })
}

function onFactGenerateResultCountsForDevice(
  { deviceId, assayId = -1, resultCategory1 = -1, resultCategory2 = -1 },
  { messageContext }
) {
  const daysToCalculate = [1, 7, 30, 60, 90, 365, 9999]

  return messageContext.transact(async knex => {
    for (const days of daysToCalculate) {
      /* eslint-disable no-await-in-loop */
      const now = new Date()

      // query for selecting data for the device
      const resultCountQuery = knex('Result as r').whereRaw(
        'r.deviceId = :deviceId and r.endedOn > :endedOn',
        {
          deviceId,
          endedOn: subDays(now, days),
        }
      )

      // calculate by device
      await knex('FactResultsDevice')
        .where({ deviceId })
        .andWhere({ days })
        .delete()

      const countByDevice = await resultCountQuery
        .clone()
        .count('r.id as resultCount')
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
          .replace(/^insert/i, 'insert ignore')
      )

      // ...grouped by assay
      await knex('FactResultsDeviceByAssay')
        .where({ deviceId })
        .andWhere({ days })
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId,
        })
        .delete()

      const countsByAssay = await resultCountQuery
        .clone()
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId,
        })
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
            .replace(/^insert/i, 'insert ignore')
        )
      }

      // ...grouped by assay, resultCategory
      await knex('FactResultsDeviceByCategory1')
        .where({ deviceId })
        .andWhere({ days })
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId,
        })
        .andWhereRaw(
          '(resultCategory1 = :resultCategory1 or :resultCategory1 = -1)',
          {
            resultCategory1,
          }
        )
        .delete()

      const countsByCategory = await resultCountQuery
        .clone()
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId,
        })
        .andWhereRaw(
          '(resultCategory1 = :resultCategory1 or :resultCategory1 = -1)',
          {
            resultCategory1,
          }
        )
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
            .replace(/^insert/i, 'insert ignore')
        )
      }

      // ...grouped by assay, resultCategory 1 & 2
      await knex('FactResultsDeviceByCategory1And2')
        .where({ deviceId })
        .andWhere({ days })
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId,
        })
        .andWhereRaw(
          '(resultCategory1 = :resultCategory1 or :resultCategory1 = -1)',
          {
            resultCategory1,
          }
        )
        .andWhereRaw(
          '(resultCategory2 = :resultCategory2 or :resultCategory2 = -1)',
          {
            resultCategory2,
          }
        )
        .delete()

      const countsByCategories = await resultCountQuery
        .clone()
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId,
        })
        .andWhereRaw(
          '(resultCategory1 = :resultCategory1 or :resultCategory1 = -1)',
          {
            resultCategory1,
          }
        )
        .andWhereRaw(
          '(resultCategory2 = :resultCategory2 or :resultCategory2 = -1)',
          {
            resultCategory2,
          }
        )
        .whereNotNull('resultCategory2')
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
            .replace(/^insert/i, 'insert ignore')
        )
      }
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
