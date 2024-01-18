const Promise = require('bluebird')
const { subDays } = require('date-fns')
const { startOfDayUtc, replaceOffset } = require('../shared/date')
const { resultWorkflowStatusToId } = require('../shared/dictionary')
const { daysToCalculate } = require('./common/constants')
const { factGenerateResultCounts } = require('./actions')
const calculateFactResultsDeviceByTimeFrame = require('./updateFactResultsDeviceByTimeFrame')

const daysToCalculateCountOfDeliveredResults = [30, 60]

async function onFactGenerateResultCounts(action, context) {
  if (action.deviceId != null) {
    // specialization if device id specified, otherwise query for devices below.
    return onFactGenerateResultCountsForDevice(action, context)
  }
  const messageContext = context.messageContext.bindActionCreators({
    factGenerateResultCounts,
  })
  return messageContext.run(async knex => {
    const items = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .select('d.id as deviceId')
    await Promise.each(items, async ({ deviceId }) => messageContext.factGenerateResultCounts(deviceId))
  })
}

async function onFactGenerateResultCountsForDevice({ deviceId, options = {} }, { messageContext }) {
  const { assayId, resultCategory1, resultCategory2, endedOn } = options
  return messageContext.transact(async knex => {
    const now = new Date()

    const timeZoneData = await knex('Device as d')
      .join('Site as s', 's.id', 'd.siteId')
      .join('Geography as g', 'g.id', 's.geographyId')
      .join('Country as c', 'c.id', 'g.countryId')
      .join('TimeZone as tz', 'c.timezone', 'tz.id')
      .first('tz.timeZone')
      .where('d.id', deviceId)

    // calculate by device - make sure it still exists
    if (!timeZoneData) {
      return
    }

    const { timeZone: timeZoneIANA } = timeZoneData

    await messageContext.initDictionaryTables()

    await Promise.each(daysToCalculate, async days => {
      const from = replaceOffset(startOfDayUtc(subDays(now, days)), timeZoneIANA)

      // query for selecting data for the device
      const query = knex('Result as r')
        .join('ResultType as rt', 'rt.id', 'r.resultTypeId')
        .where('r.deviceId', deviceId)
        .where('r.endedOn', '>=', from)
        .where('rt.excluded', false)
      const factResultsDevice = {
        calculatedOn: now,
      }
      if (daysToCalculateCountOfDeliveredResults.includes(days)) {
        const deliveredResultWorkfowStatusId = await resultWorkflowStatusToId('Delivered')
        const countByDevice = (await query
          .clone()
          .leftJoin('ResultWorkflowLog as rwl', queryBuilder => {
            queryBuilder
              .on('r.resultWorkflowStatusLogId', 'rwl.id')
              .andOn(knex.raw('rwl.resultWorkflowStatusId = ?', deliveredResultWorkfowStatusId))
              .andOn(knex.raw('rwl.changedOn > ?', from))
          })
          .first(
            knex.raw('COUNT(DISTINCT r.id) as resultCount'),
            knex.raw('SUM(CASE WHEN rwl.id IS NULL THEN 0 ELSE 1 END) as resultsDeliveredCount')
          )) || { resultCount: 0 }
        factResultsDevice.resultCount = countByDevice.resultCount
        factResultsDevice.resultsDeliveredCount = countByDevice.resultsDeliveredCount
      } else {
        const countByDevice = await query.clone().count('r.id as resultCount').select('r.deviceId').first()
        factResultsDevice.resultCount = countByDevice.resultCount
      }

      const existingFactResultsDeviceRecord = await knex('FactResultsDevice').where({ deviceId, days }).first()
      if (existingFactResultsDeviceRecord) {
        await knex('FactResultsDevice').where({ deviceId, days }).update(factResultsDevice)
      } else {
        await knex('FactResultsDevice').insert({
          ...factResultsDevice,
          deviceId,
          days,
        })
      }

      // ...grouped by assay
      const countsByAssay = await query
        .clone()
        .whereNotNull('r.assayId')
        .groupBy('r.assayid')
        .count('r.id as resultCount')
        .select('r.assayId')

      await Promise.each(countsByAssay, async count => {
        const factResultsDeviceByAssay = await knex('FactResultsDeviceByAssay')
          .where({ deviceId, assayId: count.assayId, days })
          .first()
        if (factResultsDeviceByAssay) {
          await knex('FactResultsDeviceByAssay').where({ deviceId, assayId: count.assayId, days }).update({
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        } else {
          await knex('FactResultsDeviceByAssay').insert({
            deviceId,
            assayId: count.assayId,
            days,
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        }
      })

      // ...grouped by assay, resultCategory
      const countsByCategory = await query
        .clone()
        .whereNotNull('r.assayId')
        .whereNotNull('r.resultCategory1')
        .groupBy('r.assayId', 'r.resultCategory1')
        .count('r.id as resultCount')
        .select('r.assayId', 'r.resultCategory1')

      await Promise.each(countsByCategory, async count => {
        const factResultsDeviceByCategory1 = await knex('FactResultsDeviceByCategory1')
          .where({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            days,
          })
          .first()
        if (factResultsDeviceByCategory1) {
          await knex('FactResultsDeviceByCategory1')
            .where({
              deviceId,
              assayId: count.assayId,
              resultCategory1: count.resultCategory1,
              days,
            })
            .update({ resultCount: count.resultCount, calculatedOn: now })
        } else {
          await knex('FactResultsDeviceByCategory1').insert({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            days,
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        }
      })

      // ...grouped by assay, resultCategory 1 & 2
      const countsByCategories = await query
        .clone()
        .whereNotNull('r.assayId')
        .whereNotNull('r.resultCategory1')
        .whereNotNull('r.resultCategory2')
        .groupBy('r.assayId', 'r.resultCategory1', 'r.resultCategory2')
        .count('r.id as resultCount')
        .select('r.assayId', 'r.resultCategory1', 'r.resultCategory2')

      await Promise.each(countsByCategories, async count => {
        const factResultsDeviceByCategory1And2 = await knex('FactResultsDeviceByCategory1And2')
          .where({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            resultCategory2: count.resultCategory2,
            days,
          })
          .first()
        if (factResultsDeviceByCategory1And2) {
          await knex('FactResultsDeviceByCategory1And2')
            .where({
              deviceId,
              assayId: count.assayId,
              resultCategory1: count.resultCategory1,
              resultCategory2: count.resultCategory2,
              days,
            })
            .update({
              resultCount: count.resultCount,
              calculatedOn: now,
            })
        } else {
          await knex('FactResultsDeviceByCategory1And2').insert({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            resultCategory2: count.resultCategory2,
            days,
            resultCount: count.resultCount,
            calculatedOn: now,
          })
        }
      })
    })

    // delete orphan data (=not updated in the loop)
    await knex('FactResultsDevice').where({ deviceId }).whereRaw('calculatedOn < ?', now).delete()

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

    await calculateFactResultsDeviceByTimeFrame(deviceId, assayId, resultCategory1, resultCategory2, endedOn, knex)
  })
}

module.exports = onFactGenerateResultCounts
