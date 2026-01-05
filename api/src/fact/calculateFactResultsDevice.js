/* eslint-disable no-await-in-loop */
const { subDays } = require('date-fns')
const { startOfDayUtc, replaceOffset } = require('../shared/date')
const { daysToCalculate } = require('./common/constants')
const { getBaseQueryForFactResults } = require('./common/db')

const bulkInsertThreshold = 1000

async function calculateFactResultsDevice(knex, deviceId, timeZoneIANA) {
  const now = new Date()

  let records = []

  for (const days of daysToCalculate) {
    const from = replaceOffset(startOfDayUtc(subDays(now, days)), timeZoneIANA)

    // query for selecting data for the device
    const query = getBaseQueryForFactResults(knex, deviceId, from)
    const factResultsDevice = {
      deviceId,
      days,
      calculatedOn: now,
    }
    const countByDevice = await query.clone().count('r.id as resultCount').select('r.deviceId').first()
    factResultsDevice.resultCount = countByDevice.resultCount

    records.push(factResultsDevice)
    if (records.length > bulkInsertThreshold) {
      // eslint-disable-next-line no-await-in-loop
      await knex('FactResultsDevice').insert(records).onConflict(['deviceId', 'days']).merge()
      records = []
    }
  }

  if (records.length > 0) {
    await knex('FactResultsDevice').insert(records).onConflict(['deviceId', 'days']).merge()
  }

  // delete orphan data (=not updated in the loop)
  await knex('FactResultsDevice').where({ deviceId }).whereRaw('calculatedOn < ?', now).delete()
}

module.exports = {
  calculateFactResultsDevice,
}
