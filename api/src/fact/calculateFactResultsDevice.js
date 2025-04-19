/* eslint-disable no-await-in-loop */
const { subDays } = require('date-fns')
const { startOfDayUtc, replaceOffset } = require('../shared/date')
const { resultWorkflowStatusToId } = require('../shared/dictionary')
const { daysToCalculate } = require('./common/constants')
const { getBaseQueryForFactResults } = require('./common/db')

const daysToCalculateCountOfDeliveredResults = [30, 60]
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
