const { subDays } = require('date-fns')

const _ = require('lodash')
const { startOfDayUtc } = require('../shared/date')

const probesTooLow = (resultsWithErrors, totalResults) =>
  totalResults >= 3 && resultsWithErrors / parseFloat(totalResults) >= 0.03

async function analyzeErrors(knex, action) {
  const { resultErrorCode } = action.options.data

  const moduleSerial = _.get(action.options.data, 'moduleSerial')
  const consumableLot = _.get(action.options.data, 'consumableLot')
  const assayId = _.get(action.options.data, 'assayId')
  if (parseInt(resultErrorCode, 10) === 5007) {
    const query = knex('Result')
      .where('endedOn', '>=', startOfDayUtc(subDays(new Date(), 30)))
      .first(
        knex.raw(
          'sum(case when errorcode=? then 1 else 0 end) as resultsWithErrors, count(id) as totalResults',
          resultErrorCode
        )
      )
      .modify(
        (builder, moduleSerial, consumableLot, assayId) => {
          if (moduleSerial) builder.where('moduleSerial', moduleSerial)
          else builder.where({ consumableLot, assayId })
        },
        moduleSerial,
        consumableLot,
        assayId
      )
    const { resultsWithErrors, totalResults } = await query
    action.options.data.resultsWithErrors = resultsWithErrors
    action.options.data.totalResults = totalResults

    switch (parseInt(resultErrorCode, 10)) {
      case 5007:
        return probesTooLow(resultsWithErrors, totalResults)
      default:
        return false
    }
  }
}
module.exports = {
  analyzeErrors,
  probesTooLow,
}
