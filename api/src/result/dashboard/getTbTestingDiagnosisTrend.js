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
  const groupBy = [...getGroupBy(query), 'year']

  request.query = { ...request.query, groupBy }

  // get data grouped by month via using Fact table
  const resp = await clinicalIndicatorAggregations(request)

  return resp.data
}

// tbDetection && (GxMtbRif + GxMtbRifUltra) || GxMtbXdr
const reduceByTbDetected = dataRaw => {
  let yearsList = []
  const DETECTED = 'Detected'

  const reducedYears = dataRaw.reduce((acc, it) => {
    const year = acc[it.year] || { year: it.year, MtbDetected: 0, Total: 0 }
    if (it.resultCategory1 === DETECTED) {
      year.MtbDetected = it.cnt
    }
    year.Total += it.cnt
    return { ...acc, [it.year]: year }
  }, {})

  Object.keys(reducedYears).forEach(yyyy => {
    yearsList = [...yearsList, reducedYears[yyyy]]
  })

  yearsList = yearsList.sort((a, b) => a.year - b.year)
  yearsList.forEach(year => {
    year.MtbToTotalPercentage = year.Total === 0 ? 0 : (100 * year.MtbDetected) / year.Total
  })

  return yearsList
}

// tbDetection && GxMtbXdr
const reduceByRrDetected = dataRaw => {
  let yearsList = []
  const DETECTED = 'Detected'

  const reducedYears = dataRaw.reduce((acc, it) => {
    const year = acc[it.year] || { year: it.year, MtbDetected: 0, Total: 0 }
    if (it.resultCategory2 === DETECTED) {
      year.MtbDetected = it.cnt
    }
    if (it.resultCategory1 === DETECTED) {
      year.Total += it.cnt
    }
    return { ...acc, [it.year]: year }
  }, {})

  Object.keys(reducedYears).forEach(yyyy => {
    yearsList = [...yearsList, reducedYears[yyyy]]
  })

  yearsList = yearsList.sort((a, b) => a.year - b.year)
  yearsList.forEach(year => {
    year.MtbToTotalPercentage = year.Total === 0 ? 0 : (100 * year.MtbDetected) / year.Total
  })

  return yearsList
}

async function getTbTestingDiagnosisTrend(request) {
  const dataRaw = await trendInYears(request)

  if (request.query.source === 'tbDetection') {
    // OK
    return {
      grouped: reduceByTbDetected(dataRaw),
      keysFromGrouped: ['Total', 'MtbDetected', 'MtbToTotalPercentage'], // series
      i18nKeys: {
        MtbDetected: 'MTBPlus',
        Total: 'Total',
        MtbToTotalPercentage: 'MTBPercent',
      },
    }
  }

  if (request.query.source === 'rrDetection') {
    return {
      grouped: reduceByRrDetected(dataRaw),
      keysFromGrouped: ['Total', 'MtbDetected', 'MtbToTotalPercentage'], // series
      i18nKeys: {
        MtbDetected: 'MTBPlus',
        Total: 'Total',
        MtbToTotalPercentage: 'MTBPercent',
      },
    }
  }
}

module.exports = {
  getTbTestingDiagnosisTrend,
}
