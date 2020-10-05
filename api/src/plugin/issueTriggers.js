const { subDays } = require('date-fns')

const _ = require('lodash')
const { startOfDayUtc } = require('../shared/date')

const probesTooLow = (resultsWithErrors, totalResults) =>
  totalResults >= 3 && resultsWithErrors / parseFloat(totalResults) >= 0.03

async function analyzeProbes(knex, action) {
  const { resultErrorCode } = action.options.data

  const moduleSerial = _.get(action.options.data, 'moduleSerial')
  const reagentLot = _.get(action.options.data, 'reagentLot')
  const assayId = _.get(action.options.data, 'assayId')

  if (parseInt(resultErrorCode, 10) === 5007) {
    console.log('ACTION', action)
    const query = knex('Result')
      .where('endedOn', '>=', startOfDayUtc(subDays(new Date(), 30)))
      .first(
        knex.raw(
          'sum(case when errorcode=? then 1 else 0 end) as resultsWithErrors, count(id) as totalResults',
          resultErrorCode
        )
      )
      .modify(
        (builder, moduleSerial, reagentLot, assayId) => {
          if (moduleSerial) builder.where('moduleSerial', moduleSerial)
          else builder.where({ consumableLot: reagentLot, assayId })
        },
        moduleSerial,
        reagentLot,
        assayId
      )
    console.log('query', query.toString())
    const { resultsWithErrors, totalResults } = await query
    action.options.data.resultsWithErrors = resultsWithErrors
    action.options.data.totalResults = totalResults

    switch (parseInt(resultErrorCode, 10)) {
      case 5007:
        console.log('resultsWithErrors', resultsWithErrors, totalResults)
        return probesTooLow(resultsWithErrors, totalResults)
      default:
        return false
    }
  }
}
module.exports = {
  analyzeProbes,
  probesTooLow,
}
