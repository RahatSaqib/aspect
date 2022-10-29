const { startOfMonth, endOfMonth, parseISO } = require('date-fns')
const Promise = require('bluebird')

async function refreshFactResultsDeviceByTimeFrame({
  deviceId,
  knex,
  messageContext,
  now,
  query,
  resultEndedOn,
  timeFramesToCalculate,
}) {
  //
  await messageContext.initDictionaryTables()

  /**
   * try to get plugin `modifyQueryToExcludeResult` for device's partnerId
   */
  let modifyToExcludeTests
  const { partnerId } = await knex('Device').where('id', deviceId).select('partnerId').first()
  const { getPartnerPluginName } = require('../plugin/utils')
  const partnerPluginName = await getPartnerPluginName({ partnerId })
  if (partnerPluginName) {
    const { loadPlugin } = require('../plugin/registration')
    modifyToExcludeTests = await loadPlugin([partnerPluginName], 'modifyQueryToExcludeResult')
  }

  await Promise.each(timeFramesToCalculate, async timeFrame => {
    // ...grouped by assay, resultCategory 1 & 2
    const countsByCategories = await query
      .clone()
      /**
       * exec plugin `modifyQueryToExcludeResult` if country has it defined
       */
      .join('Assay as a', 'a.id', 'r.assayId')
      .modify(queryBuilder => {
        if (modifyToExcludeTests) {
          modifyToExcludeTests(queryBuilder, null, {
            assay: 'a',
            result: 'r',
            displayResult: 'actual',
          })
        }
      })

      .whereNotNull('r.assayId')
      .whereNotNull('r.resultCategory1')
      .groupBy('r.assayId', 'r.resultCategory1', 'r.resultCategory2', 'startedOnTimeFrame')
      .count('r.id as resultCount')
      .modify(qb => {
        if (resultEndedOn) {
          // TODO: we'll have to account for different timeframes here if we ever want to calculate more than just month
          qb.whereBetween('r.endedOn', [startOfMonth(parseISO(resultEndedOn)), endOfMonth(parseISO(resultEndedOn))])
        }
      })
      .select(
        'r.assayId',
        'r.resultCategory1',
        'r.resultCategory2',
        knex.raw('DATE_FORMAT(IFNULL(r.endedOn, r.startedOn), "%Y-%m-01") as startedOnTimeFrame')
      )
    // if we didn't get an endedOn, generate all time frames since first result from device
    await Promise.each(countsByCategories, async count => {
      const factResultsDeviceByCategory1And2 = await knex('FactResultsDeviceByTimeFrame')
        .where({
          deviceId,
          assayId: count.assayId,
          resultCategory1: count.resultCategory1,
          resultCategory2: count.resultCategory2,
          timeFrame,
          startedOn: count.startedOnTimeFrame,
        })
        .first()
      if (factResultsDeviceByCategory1And2) {
        await knex('FactResultsDeviceByTimeFrame')
          .where({
            deviceId,
            assayId: count.assayId,
            resultCategory1: count.resultCategory1,
            resultCategory2: count.resultCategory2,
            timeFrame,
            startedOn: count.startedOnTimeFrame,
          })
          .update({
            resultCount: count.resultCount,
            calculatedOn: now,
          })
      } else {
        await knex('FactResultsDeviceByTimeFrame').insert({
          deviceId,
          assayId: count.assayId,
          resultCategory1: count.resultCategory1,
          resultCategory2: count.resultCategory2,
          timeFrame,
          resultCount: count.resultCount,
          calculatedOn: now,
          startedOn: count.startedOnTimeFrame,
        })
      }
    })
  })
}

module.exports = {
  refreshFactResultsDeviceByTimeFrame,
}
