const { subDays } = require('date-fns')

const _ = require('lodash')
const { startOfDayUtc } = require('../shared/date')

const analyzeResultsWithErrors = (
  resultsWithErrors,
  totalResults,
  threshold,
  below,
  minResults
) => {
  const percentage = resultsWithErrors / parseFloat(totalResults)
  return (
    totalResults >= minResults &&
    (below ? percentage <= threshold : percentage >= threshold)
  )
}
async function analyzeErrors(
  knex,
  action,
  { errorCode, threshold, below, daysPeriod, minResults }
) {
  const { resultErrorCode } = action.options.data

  const moduleSerial = _.get(action.options.data, 'moduleSerial')
  const consumableLot = _.get(action.options.data, 'consumableLot')
  const assayId = _.get(action.options.data, 'assayId')
  if (parseInt(resultErrorCode, 10) === errorCode) {
    const query = knex('Result')
      .where('endedOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
      .first(
        knex.raw(
          'sum(case when errorcode=? then 1 else 0 end) as resultsWithErrors, count(id) as totalResults',
          resultErrorCode
        )
      )
      .modify(
        (builder, moduleSerial, consumableLot, assayId) => {
          if (moduleSerial) builder.where({ moduleSerial })
          else builder.where({ consumableLot, assayId })
        },
        moduleSerial,
        consumableLot,
        assayId
      )
    const { resultsWithErrors, totalResults } = await query
    action.options.data.resultsWithErrors = resultsWithErrors
    action.options.totalResults = totalResults
    return analyzeResultsWithErrors(
      resultsWithErrors,
      totalResults,
      threshold,
      below,
      minResults
    )
  }
  return false
}
module.exports = {
  analyzeErrors,
  analyzeResultsWithErrors,
}
