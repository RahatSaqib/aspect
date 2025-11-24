/* eslint-disable no-await-in-loop */
const { subDays } = require('date-fns')
const { startOfDayUtc, replaceOffset } = require('../shared/date')
const { getBaseQueryForFactResults } = require('./common/db')
const { daysToCalculate } = require('./common/constants')

const bulkInsertThreshold = 1000

async function calculateFactResultsDeviceByAssay(knex, deviceId, assayId, timeZoneIANA) {
  const now = new Date()

  let records = []

  for (const days of daysToCalculate) {
    const from = replaceOffset(startOfDayUtc(subDays(now, days)), timeZoneIANA)

    // query for selecting data for the device
    const query = getBaseQueryForFactResults(knex, deviceId, from)

    // ...grouped by assay
    const countsByAssay = await query
      .clone()
      .whereNotNull('r.assayId')
      .groupBy('r.assayid')
      .count('r.id as resultCount')
      .select('r.assayId')

    const recordsByAssay = countsByAssay.map(count => ({
      deviceId,
      assayId: count.assayId,
      days,
      resultCount: count.resultCount,
      calculatedOn: now,
    }))
    records.push(...recordsByAssay)

    if (records.length > bulkInsertThreshold) {
      // eslint-disable-next-line no-await-in-loop
      await knex('FactResultsDeviceByAssay').insert(records).onConflict(['deviceId', 'assayId', 'days']).merge()
      records = []
    }
  }

  if (records.length > 0) {
    await knex('FactResultsDeviceByAssay').insert(records).onConflict(['deviceId', 'assayId', 'days']).merge()
  }

  // delete orphan data (=not updated in the loop)
  await knex('FactResultsDeviceByAssay')
    .where({ deviceId })
    .whereRaw('calculatedOn < ?', now)
    .modify(queryBuilder => {
      if (assayId) {
        queryBuilder.where({ assayId })
      }
    })
    .delete()
}

module.exports = {
  calculateFactResultsDeviceByAssay,
}
