const { subDays } = require('date-fns')
const { factGenerateResultCounts } = require('./actions')
const {
  deviceOffline,
  deviceNoResults,
  deviceHasNewResults,
} = require('../device/actions')

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
        const maxLastDateOffline =
          maxDaysDeviceOffline == null
            ? null
            : subDays(now, maxDaysDeviceOffline)
        const maxLastDateNoResult =
          maxDaysDeviceNoResults == null
            ? null
            : subDays(now, maxDaysDeviceNoResults)
        if (
          lastPingOn == null ||
          (maxLastDateOffline != null && lastPingOn <= maxLastDateOffline)
        ) {
          context.deviceOffline(id)
        } else if (
          maxLastDateNoResult != null &&
          ((lastResultOn != null && lastResultOn <= maxLastDateNoResult) ||
            (lastResultOn == null && deviceCreatedOn <= maxLastDateNoResult))
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

function onDeviceUpdateFlag(updates) {
  return ({ deviceId }, { messageContext }) =>
    messageContext.run(async knex => {
      const updatedRows = await knex('FactDeviceFlag')
        .where({ deviceId })
        .update(updates)
      if (updatedRows === 0) {
        await knex('FactDeviceFlag').insert(
          Object.assign({ deviceId }, updates)
        )
      }
    })
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
    const daysToCalculate = [1, 7, 30, 60, 90, 365, 9999]

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

module.exports = {
  onFactGenerateDeviceConnectivity,
  onFactGenerateResultCounts,
  onDeviceUpdateFlag,
  onResultLogged,
}
