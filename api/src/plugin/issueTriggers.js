const { subDays } = require('date-fns')

const { startOfDayUtc } = require('../shared/date')

const probesTooLow = (resultsWithErrors, totalResults) =>
  totalResults >= 3 && resultsWithErrors / parseFloat(totalResults) >= 0.03

async function analyzeProbes(knex, action) {
  const data = JSON.parse(action.issue.data)
  if (parseInt(data.resultErrorCode, 10) === 5007) {
    const { resultsWithErrors, totalResults } = await knex('Result')
      .where('moduleSerial', data.moduleSerial)
      .andWhere('endedOn', '>=', startOfDayUtc(subDays(new Date(), 30)))
      .fitst(
        knex.raw(
          "sum(case when errorcode='?' then 1 else 0 end) as resultsWithErrors, count(id) as totalResults",
          data.resultErrorCode
        )
      )
    switch (parseInt(data.resultErrorCode, 10)) {
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
