const { getYear } = require('../../shared/date.js')
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
const reduceByTbDetected = (dataRaw, fromYear, toYear) => {
  let yearsList = []
  const initialResponse = {}
  for (const y of [...Array(toYear - fromYear + 1).keys()]) {
    initialResponse[`${y + fromYear}`] = {
      year: y + fromYear,
      MtbDetected: 0,
      Total: 0,
    }
  }

  const DETECTED = 'Detected'

  const reducedYears = dataRaw.reduce((acc, it) => {
    const year = acc[it.year]
    if (it.resultCategory1 === DETECTED) {
      year.MtbDetected = it.cnt
    }
    year.Total += it.cnt
    return { ...acc, [it.year]: year }
  }, initialResponse)

  Object.keys(reducedYears).forEach(yyyy => {
    yearsList = [...yearsList, reducedYears[yyyy]]
  })

  yearsList = yearsList.sort((a, b) => a.year - b.year)
  yearsList.forEach(year => {
    year.MtbToTotalPercentage = year.Total === 0 ? 0 : (100 * year.MtbDetected) / year.Total
  })

  return yearsList
}

// rrDetection && GxMtbRif + GxMtbRifUltra
const reduceByRrDetected = dataRaw => {
  let yearsList = []
  const DETECTED = 'Detected'

  const reducedYears = dataRaw.reduce((acc, it) => {
    const year = acc[it.year] || { year: it.year, rrDetected: 0, tbTotal: 0 }
    if (it.resultCategory2 === DETECTED) {
      year.rrDetected = it.cnt
    }
    if (it.resultCategory1 === DETECTED) {
      year.tbTotal += it.cnt
    }
    return { ...acc, [it.year]: year }
  }, {})

  Object.keys(reducedYears).forEach(yyyy => {
    yearsList = [...yearsList, reducedYears[yyyy]]
  })

  yearsList = yearsList.sort((a, b) => a.year - b.year)
  yearsList.forEach(year => {
    year.rrToTbTotalPercentage = year.tbTotal === 0 ? 0 : (100 * year.rrDetected) / year.tbTotal
  })

  return yearsList
}

async function getTbTestingDiagnosisTrend(request) {
  const dataRaw = await trendInYears(request)

  if (request.query.source === 'tbDetection') {
    // OK
    return {
      grouped: reduceByTbDetected(dataRaw, getYear(request.query.minDate), getYear(request.query.maxDate)),
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
      keysFromGrouped: ['tbTotal', 'rrDetected', 'rrToTbTotalPercentage'], // series
      i18nKeys: {
        rrDetected: 'rrDetected',
        tbTotal: 'TbTotal',
        rrToTbTotalPercentage: 'rrToTbTotalPercentage',
      },
    }
  }
}

module.exports = {
  getTbTestingDiagnosisTrend,
}
