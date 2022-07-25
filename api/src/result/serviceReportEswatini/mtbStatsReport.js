const { reduce, min, round } = require('lodash')
const { addDays, differenceInDays, parseISO } = require('date-fns')
const { knex, filterDateRangeParams, filterParams } = require('../../db')

const { getBaseQuery, modifiers } = require('../query')
const { SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY } = require('../query')

function addErrorTableSiteTotals(data) {
  const totalsBySite = reduce(
    data,
    (t, error) => {
      t[error.siteName] = (t[error.siteName] || 0) + error.total
      return t
    },
    {}
  )

  const errorTableItems = []
  let i = 0
  while (i < data.length) {
    const { siteName } = data[i]
    let mtbInvalid = 0
    let mtbNoResult = 0

    while (i < data.length && siteName === data[i].siteName) {
      const item = data[i]
      errorTableItems.push({
        ...item,
        percentagePerModule: totalsBySite[siteName] > 0 ? round((item.total * 100) / totalsBySite[siteName], 2) : 0,
      })
      mtbInvalid += item.mtbInvalid
      mtbNoResult += item.mtbNoResult
      i += 1
    }

    // Add a TOTAL row for the site
    errorTableItems.push({
      siteName: 'TOTAL',
      mtbInvalid,
      mtbNoResult,
    })
  }

  return errorTableItems
}

async function getErrorTable(dataConstraints, params) {
  const { errorRate, mtbInvalid, mtbNoResult } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY
  const data = await getBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(filterParams, params)
    .modify(filterDateRangeParams, params, 'r.endedOn')
    .groupBy(['r.deviceId', 'r.moduleName', 'r.moduleSerial'])
    .select({
      mtbInvalid,
      mtbNoResult,
      errorRate,
      total: knex.raw('IFNULL(COUNT(r.id), 0)'),
      moduleName: knex.raw("IFNULL(r.moduleName, 'NA')"),
      moduleSerial: knex.raw("IFNULL(r.moduleSerial, 'NA')"),
      siteName: 'si.name',
    })
    .orderBy(['si.id', 'r.moduleName', 'r.moduleSerial'])

  return data
}

async function getGeneralStatsForMapping(dataConstraints, params) {
  const daysInRange = differenceInDays(
    min([parseISO(params.maxDate), addDays(new Date(), -1)]),
    parseISO(params.minDate)
  )

  const {
    mtbDetected,
    mtbNotDetected,
    mtbDetectedRifNotDetected,
    mtbDetectedRifDetected,
    mtbTraceDetected,
    mtbInvalid,
    mtbError,
    mtbDetectedRifIndeterminate,
    mtbNoResult,
  } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY
  const data = await getBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
    .modify(filterParams, params)
    .modify(filterDateRangeParams, params, 'r.endedOn')
    .select({
      mtbDetected,
      mtbNotDetected,
      mtbDetectedRifNotDetected,
      mtbDetectedRifDetected,
      mtbTraceDetected,
      mtbInvalid,
      mtbNoResult,
      mtbError,
      mtbDetectedRifIndeterminate,
      total: knex.raw('IFNULL(COUNT(r.id), 0)'),
      totalRif: knex.raw('IFNULL(SUM(CASE WHEN r.resultCategory2 IS NOT NULL THEN 1 ELSE 0 END), 0)'),
    })
    .first()

  data.mtbInconclusive = data.mtbInvalid + data.mtbNoResult + data.mtbError
  data.mtbValid = data.mtbDetected + data.mtbNotDetected
  data.percentMtbDetected = data.total > 0 ? round((data.mtbDetected * 100) / data.total, 2) : 0
  data.percentRifDetected = data.totalRif > 0 ? round((data.mtbDetectedRifDetected * 100) / data.totalRif, 2) : 0
  data.percentMtbError = data.total > 0 ? round((data.mtbError * 100) / data.total, 2) : 0
  data.avgTestsPerDay = round(data.total / daysInRange, 2)

  return data
}

module.exports = {
  getGeneralStatsForMapping,
  getErrorTable,
  addErrorTableSiteTotals,
}
