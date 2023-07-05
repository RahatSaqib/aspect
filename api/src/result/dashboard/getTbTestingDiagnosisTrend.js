const { getGroupBy, clinicalIndicatorAggregations } = require('../common/logic')
/**
 * query reducer for PK dashboard endpoint '/result/tb-testing-diagnosis-trend'
 * @param {*} request
 * @returns an object with the following shape:
 *  {
 *   YYYY: [
 *        { cnt: xxx, resultCategory1: 'Detected', ... }, <---- `cnt` and each groupBy param
 *        { cnt: xxx, resultCategory1: 'NotDetected', ... },
 *   ],
 * }
 */
async function trendInYears(request) {
  const { query } = request
  let groupBy = [...getGroupBy(query), 'year']

  request.query = { ...request.query, groupBy }

  // get data grouped by month via using Fact table
  const resp = await clinicalIndicatorAggregations(request)

  // remove `month` from groupBy array to use rest of groupBy items
  groupBy = groupBy.filter(it => it !== 'year')

  return resp.data
}

async function getTbTestingDiagnosisTrend(request) {
  const dataRaw = await trendInYears(request)
  const DETECTED = 'Detected'

  // get final data set groped by rest of items
  let yearsList = []

  const reducedYears = dataRaw.reduce((acc, it) => {
    const year = acc[it.year] || { year: it.year, MtbDetected: 0, Total: 0 }
    if (it.resultCategory1 === DETECTED) {
      year.MtbDetected = it.cnt
    }
    year.Total += it.cnt
    return { ...acc, [it.year]: year }
  }, {})

  // years
  Object.keys(reducedYears).forEach(yyyy => {
    yearsList = [...yearsList, reducedYears[yyyy]]
  })

  yearsList = yearsList.sort((a, b) => a.year - b.year)
  yearsList.forEach(year => {
    year.MtbToTotalPercentage = year.Total === 0 ? 0 : (100 * year.MtbDetected) / year.Total
  })

  return {
    grouped: yearsList, // []
    keysFromGrouped: ['Total', 'MtbDetected', 'MtbToTotalPercentage'], // series
    i18nKeys: {
      MtbDetected: 'MTBPlus',
      Total: 'Total',
      MtbToTotalPercentage: 'MTBPercent',
    },
  }
}

module.exports = {
  getTbTestingDiagnosisTrend,
}
