/* eslint-disable no-await-in-loop */
const { subDays } = require('date-fns')
const { startOfDayUtc, replaceOffset } = require('../shared/date')
const { getBaseQueryForFactResults } = require('./common/db')
const { daysToCalculate } = require('./common/constants')

const bulkInsertThreshold = 1000

async function calculateFactResultsDeviceByCategory1(knex, deviceId, assayId, resultCategory1, timeZoneIANA) {
  const now = new Date()

  let records = []

  for (const days of daysToCalculate) {
    const from = replaceOffset(startOfDayUtc(subDays(now, days)), timeZoneIANA)

    // query for selecting data for the device
    const query = getBaseQueryForFactResults(knex, deviceId, from)

    // ...grouped by assay, resultCategory
    const countsByCategory = await query
      .clone()
      .whereNotNull('r.assayId')
      .whereNotNull('r.resultCategory1')
      .groupBy('r.assayId', 'r.resultCategory1')
      .count('r.id as resultCount')
      .select('r.assayId', 'r.resultCategory1')

    const recordsByCategory = countsByCategory.map(count => ({
      deviceId,
      assayId: count.assayId,
      resultCategory1: count.resultCategory1,
      days,
      resultCount: count.resultCount,
      calculatedOn: now,
    }))
    records.push(...recordsByCategory)

    if (records.length > bulkInsertThreshold) {
      await knex('FactResultsDeviceByCategory1')
        .insert(records)
        .onConflict(['deviceId', 'assayId', 'days', 'resultCategory1'])
        .merge()
      records = []
    }
  }

  if (records.length > 0) {
    await knex('FactResultsDeviceByCategory1')
      .insert(records)
      .onConflict(['deviceId', 'assayId', 'days', 'resultCategory1'])
      .merge()
  }

  // delete orphan data (=not updated in the loop)
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
}

module.exports = {
  calculateFactResultsDeviceByCategory1,
}
