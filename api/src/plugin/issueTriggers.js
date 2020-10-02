const { subDays } = require('date-fns')

const { startOfDayUtc } = require('../shared/date')

const probesTooLow = (resultsWithErrors, totalResults) =>
  totalResults >= 3 && resultsWithErrors / parseFloat(totalResults) >= 0.03

async function analyzeProbes(knex, action) {
  const { moduleSerial, resultErrorCode } = action.options.data

  if (parseInt(resultErrorCode, 10) === 5007) {
    const { resultsWithErrors, totalResults } = await knex('Result')
      .where('moduleSerial', moduleSerial)
      .andWhere('endedOn', '>=', startOfDayUtc(subDays(new Date(), 30)))
      .first(
        knex.raw(
          'sum(case when errorcode=? then 1 else 0 end) as resultsWithErrors, count(id) as totalResults',
          resultErrorCode
        )
      )
    switch (parseInt(resultErrorCode, 10)) {
      case 5007:
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
