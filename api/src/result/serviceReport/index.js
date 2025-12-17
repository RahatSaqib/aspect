const _ = require('lodash')
const dateFormat = require('date-fns/format')
const locales = require('date-fns/locale')
const { endOfMonth, endOfYear, startOfMonth, subMonths, addMonths } = require('date-fns')

const { knex } = require('../../db')
const { getPersonByPersonId } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { exportData, getMaxLimitPlaceHolders, getBaseReplacements } = require('../../shared/excel')
const { processGroupedQuery } = require('../common/db')

const getReportXdrDevicesSummary = require('./xdrDevicesSummaryReport')
const getAllResultsReport = require('./getAllResultsReport')
const getDataExtractReport = require('./dataExtractForTableau')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const { getClinicalIndicatorQueryForResultsTable } = require('../service')
const { getGroupBy } = require('../common/logic')
const downloadReport = require('../../report/downloadReport')

/**
 * 'header' is for 1st row in CSV file,
 * 'key' is prop name in array 'items' in func getDeviceErrorHistoryForAttachment() below
 */
const columnsDeviceErrorHistoryForAttachment = [
  { header: 'Source', key: 'source' },
  { header: 'Date/Time', key: 'dateTime' },
  { header: 'Actual Date/Time (UTC)', key: 'actualDateTime' },
  { header: 'Instrument Serial Number', key: 'instrumentSerial' },
  { header: 'GX System Name', key: 'gxSystemName' },
  { header: 'GX Software Version', key: 'gxSoftwareVersion' },
  { header: 'Module Position', key: 'moduleName' },
  { header: 'Module Serial Number', key: 'moduleSerial' },
  { header: 'Assay', key: 'assay' },
  { header: 'Assay Version', key: 'assayVersion' },
  { header: 'Cartridge Lot', key: 'cartridgeLot' },
  { header: 'Cartridge Serial Number', key: 'cartridgeSerial' },
  { header: 'Operator ID', key: 'operatorId' },
  { header: 'Test Outcome', key: 'result' },
  { header: 'Error Code', key: 'errorCode' },
  { header: 'Error Message', key: 'errorMessage' },
]

// ----------------------------------------------------------------------------------------------
async function exportResults(request, reply) {
  return downloadReport({ ...request, params: { externalId: 'all_results' } }, reply)
}

async function getDeviceErrorHistoryForAttachment(deviceId, minDate, maxDate) {
  // treat all words A1..D4 as moduleName in DeviceOperation table
  const regexDeviceOperationModuleName = `REGEXP_SUBSTR(do.data ->> '$.details.RawText', '[A-D][1-4]')`
  /**
   * for current device
   *
   * select errors from Result table
   */
  const filterUntilDate = (queryBuilder, untilDate, fieldName = 'r.endedOn') => {
    if (untilDate) queryBuilder.where(`${fieldName}`, '<=', untilDate)
  }
  const items = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftOuterJoin('TimeZone as tz', 'd.timezone', 'tz.id')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftOuterJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where('r.deviceId', deviceId)
    .where('r.endedOn', '>=', minDate)
    .modify(filterUntilDate, maxDate)
    .select(
      knex.raw('"Assay" as source'),
      /**
       * see list of all columns for CSV file in 2nd tab
       * of Excel file attached to https://ops.systemone.id/browse/ASP-1857
       */
      knex.raw(`ifnull(convert_tz(r.endedOn, '+00:00', tz.timeZone), r.endedOn) as dateTime`), // 1. Test Date/time in device time
      'r.endedOn as actualDateTime', // 2. Actual Date/Time
      'r.instrumentSerial', // 3. Instrument Serial Number
      knex.raw(`ifnull(r.resultData ->> '$.systemName', d.configurationData ->> '$.systemName') as gxSystemName`), // 4. GX System Name
      'r.senderVersion as gxSoftwareVersion', // 5. GX Software Version
      'r.moduleSerial', // 6. Module Serial Number
      knex.raw(`r.resultData ->> '$.assay' as assay`), // 7. Assay
      knex.raw(`r.resultData ->> '$.assayVersion' as assayVersion`), // 8. Assay Version
      'r.consumableLot as cartridgeLot', // 9. Cartridge Lot
      'r.consumableSerial as cartridgeSerial', // 10. Cartridge Serial Number
      'r.senderOperator as operatorId', // 11. Operator ID
      // 12. Test Outcome
      knex.raw(`
        CASE
        WHEN rc1.externalId IN ('Error', 'Invalid', 'NoResult') THEN rc1.externalId
        ELSE 'Success'
        END as result
      `),
      'r.errorCode', // 14. Error Code
      'r.errorNotes as errorMessage',
      'r.moduleName'
    )
    .union([
      /**
       * select hardware errors from DeviceOperation table
       */
      knex('DeviceOperation as do')
        .innerJoin('Device as d', 'do.deviceId', 'd.id')
        .leftOuterJoin('TimeZone as tz', 'd.timezone', 'tz.id')
        .where('do.deviceId', deviceId)
        .where('do.startedOn', '>=', minDate)
        .modify(filterUntilDate, maxDate, 'do.startedOn')
        // JSON prop type='gx-log' marks entry received from GxConnect as GeneXpert log
        .whereRaw(`IFNULL(do.data ->> '$.type', '') = 'gx-log'`)
        /**
         * JSON array details.Errors should contain some error code
         * Notice that below we get entries with any error code (grabbed
         * from GeneXpert logs).
         * Easy to narrow, if we need, to only some set of error codes.
         */
        .whereRaw(`IFNULL(do.data ->> '$.details.Errors[0].ErrorCode', 0) > 0`)
        .select(
          knex.raw('"System Log" as source'),
          'do.startedOn as dateTime',
          knex.raw(`convert_tz(do.startedOn, tz.timeZone, '+00:00') as actualDateTime`),
          knex.raw(`'-' as instrumentSerial`),
          knex.raw(`ifnull(d.configurationData ->> '$.systemName', '-') as gxSystemName`),
          knex.raw(`'-' as gxSoftwareVersion`),
          knex.raw(`'-' as moduleSerial`),
          knex.raw(`'-' as assay`),
          knex.raw(`'-' as assayVersion`),
          knex.raw(`'-' as cartridgeLot`),
          knex.raw(`'-' as cartridgeSerial`),
          knex.raw(`'-' as operatorId`),
          knex.raw(`'-' as result`),
          knex.raw(`do.data ->> '$.details.Errors[0].ErrorCode' as errorCode`),
          knex.raw(`do.data ->> '$.details.Errors[0].Message' as errorMessage`),
          // treat all words A1..D4 as moduleName
          knex.raw(`${regexDeviceOperationModuleName} as moduleName`)
        ),
    ])
    /**
     * do not use `.orderBy()` in queries with `.union()` because by some reason
     * knex inserts `order by` clause right after 1st query before `union`
     * which throws error.
     * Instead - do ordering with lodash means after getting actual data
     */
    .then(items => _.orderBy(items, ['dateTime']))

  // fix hardware entries, if any
  // eslint-disable-next-line no-constant-condition
  if ((_.some(items), { source: 'System Log' })) {
    // for hardware errors, we don't have senderversion or module serial, only module name -> get all serials by slot along with instrument serial and sender version by max result date
    const missingFields = ['r.moduleName', 'r.moduleSerial', 'r.instrumentSerial', 'r.senderVersion']
    const results = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .modify(filterUntilDate, maxDate)
      .groupBy(missingFields)
      .select(missingFields)
      .min('r.endedOn as endedOn')
      .orderBy('endedOn', 'desc')

    _.each(_.filter(items, { source: 'System Log' }), i => {
      const instrumentData = _.find(results, r => {
        return r.endedOn <= i.dateTime
      })
      const moduleData = _.find(results, r => {
        return r.endedOn <= i.dateTime && r.moduleSerial && r.moduleName === i.moduleName
      })

      if (instrumentData) {
        i.gxSoftwareVersion = instrumentData.senderVersion
        i.instrumentSerial = instrumentData.instrumentSerial
        i.moduleSerial = moduleData ? moduleData.moduleSerial : '-'
      }
    })
  }

  return {
    items,
    columns: columnsDeviceErrorHistoryForAttachment,
  }
}

// ------------------------------------------------------
function getDynamicColumnsForDateRange(dateFrom, dateTo, { locale }) {
  let monthColumns = []
  let currMonthDate = dateFrom
  const lastYear = endOfYear(dateTo)

  while (currMonthDate < lastYear) {
    monthColumns.push({
      key: dateFormat(currMonthDate, 'yyyy-MM'),
      header: dateFormat(currMonthDate, 'LLL-yyyy', {
        locale: locales[locale],
      }),
      type: 'month',
      monthDate: currMonthDate,
    })
    currMonthDate = addMonths(currMonthDate, 1)
  }
  // make sure array `monthColumns` is sorted by month
  monthColumns = _.sortBy(monthColumns, ['key'])

  let currQuarter
  let currQuarterMonths = []
  let currYear
  let currYearMonths = []
  let dynamicColumns = []
  const appendQuarter = () => {
    dynamicColumns = [
      ...dynamicColumns,
      {
        key: currQuarter,
        header: currQuarter,
        type: 'quarter',
        months: currQuarterMonths,
      },
    ]
    currQuarterMonths = []
  }
  const appendYear = () => {
    dynamicColumns = [
      ...dynamicColumns,
      {
        key: currYear,
        header: `Annual-${currYear}`,
        type: 'year',
        months: currYearMonths,
      },
    ]
    currYearMonths = []
  }
  for (let j = 0; j < monthColumns.length; j++) {
    const monthColumn = monthColumns[j]
    currMonthDate = monthColumn.monthDate

    dynamicColumns = [...dynamicColumns, monthColumn]

    currQuarterMonths.push(monthColumn.key)
    currYearMonths.push(monthColumn.key)

    currQuarter = dateFormat(currMonthDate, 'qqq-yy')
    currYear = dateFormat(currMonthDate, 'yyyy')

    if (j + 1 < monthColumns.length) {
      const nextMonthDate = monthColumns[j + 1].monthDate
      if (currQuarter !== dateFormat(nextMonthDate, 'qqq-yy')) {
        appendQuarter()
      }
      if (currYear !== dateFormat(nextMonthDate, 'yyyy')) {
        appendYear()
      }
    }
  }
  appendQuarter()
  appendYear()

  return dynamicColumns
}

// ------------------------------------------------------
async function getReportWorkloadSummary(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getPersonByPersonId(auth.credentials.personId)
  const locale = culture.split('-')[0].toLowerCase()
  const now = new Date()
  const { minDate = now, maxDate = now } = query

  let dateFrom = startOfMonth(_.isString(minDate) ? new Date(minDate) : minDate)
  const dateTo = endOfMonth(_.isString(maxDate) ? new Date(maxDate) : maxDate)

  if (dateFrom >= dateTo) {
    dateFrom = startOfMonth(subMonths(dateTo, 1))
  }

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }

  const SECTION_KEY_ALL = 'all'
  const SECTION_KEY_MTB = 'mtb'
  const SECTION_KEY_RRD = 'rrd'
  const sectionKeys = [SECTION_KEY_ALL, SECTION_KEY_MTB, SECTION_KEY_RRD]
  const emptyCounts = _.reduce(
    sectionKeys,
    (acc, key) => {
      acc[key] = 0
      return acc
    },
    {}
  )

  const groupBy = getGroupBy(query)

  /**
   * get data
   */
  const resultQuery = getClinicalIndicatorQueryForResultsTable(dataConstraints, assay, groupBy, query)

  let data = await processGroupedQuery(knex, resultQuery, groupBy)
  data = _.sortBy(data, ['state', 'month'])

  /**
   * count all numbers (via formatting data as object)
   * {
   *  [state]: {
   *    [month]: {
   *      all: ###,
   *      mtb: ###,
   *      rrd: ###,
   *    },
   *    ...
   *  },
   *  ...
   * }
   */
  const positiveResultCategories = getPositiveCategoriesExternalIds()
  const obj = _.reduce(
    data,
    (acc, item) => {
      const { state: _state, month, cnt, resultCategory1, resultCategory2 } = item
      const state = _state || 'No province assigned'
      acc[state] = acc[state] || {}
      acc[state][month] = acc[state][month] || { ...emptyCounts }
      // count 'all'
      acc[state][month][SECTION_KEY_ALL] += cnt
      // count 'mtb'
      if (positiveResultCategories.includes(resultCategory1)) {
        acc[state][month][SECTION_KEY_MTB] += cnt
      }
      // count 'rrd'
      if (positiveResultCategories.includes(resultCategory1) && positiveResultCategories.includes(resultCategory2)) {
        acc[state][month][SECTION_KEY_RRD] += cnt
      }
      return acc
    },
    {}
  )

  // define dynamic columns
  const dynamicColumns = getDynamicColumnsForDateRange(dateFrom, dateTo, {
    locale,
  })
  const fillSolid = { type: 'pattern', pattern: 'solid' }
  const dynamicQuarterColumns = dynamicColumns
    .filter(it => it.type === 'quarter')
    .map(it => {
      it.style = {
        fill: { ...fillSolid, fgColor: { argb: 'FFddebf7' } },
      }
      return it
    })
  const dynamicYearColumns = dynamicColumns
    .filter(it => it.type === 'year')
    .map(it => {
      it.style = {
        fill: { ...fillSolid, fgColor: { argb: 'FF9bc2e6' } },
      }
      return it
    })

  // helper
  const sumAllMonths = (row, column) => {
    const sum = _.reduce(
      column.months,
      (acc, month) => {
        acc += row[month] ?? 0
        return acc
      },
      0
    )
    row[column.key] = sum
  }
  const sumPerStates = (rowTotal, row, key) => {
    rowTotal[key] = (rowTotal[key] ?? 0) + row[key]
  }
  /**
   * define final `data` object for report
   */
  data = {}
  // for each section ...
  sectionKeys.forEach(sectionKey => {
    // start section data with empty array of rows
    data[sectionKey] = []
    // separate row with `Total` across all states for each column
    const rowTotal = { state: 'TOTAL' }
    data[sectionKey].push(rowTotal)
    // for each `state` ...
    _.forEach(obj, (months, state) => {
      const row = { state }
      // 1. process all fetched months
      _.forEach(months, (item, month) => {
        row[month] = item[sectionKey]
        sumPerStates(rowTotal, row, month)
      })
      // 2. process all quarters
      _.forEach(dynamicQuarterColumns, quarterColumn => {
        sumAllMonths(row, quarterColumn)
        sumPerStates(rowTotal, row, quarterColumn.key)
      })
      // 3. process all years
      _.forEach(dynamicYearColumns, yearColumn => {
        sumAllMonths(row, yearColumn)
        sumPerStates(rowTotal, row, yearColumn.key)
      })
      // add row to the section data
      data[sectionKey].push(row)
    })
  })

  return {
    ok: true,
    total: data[SECTION_KEY_ALL].length,
    length: data[SECTION_KEY_ALL].length,
    data,
    dynamicColumns,
    sections: [
      {
        dataSource: SECTION_KEY_ALL,
      },
      {
        dataSource: SECTION_KEY_MTB,
      },
      {
        dataSource: SECTION_KEY_RRD,
      },
    ],
  }
}

// ------------------------------------------------------
async function getReportWorkloadSummaryByQuarter(auth, query, timezone, options) {
  const { sharedResults, useNamedData } = options
  const result = sharedResults[useNamedData]
  const dynamicColumns = result.dynamicColumns.filter(it => it.type === 'quarter' || it.type === 'year')

  return {
    ...result,
    dynamicColumns,
  }
}

// ------------------------------------------------------
async function getReportWorkloadSummaryByYear(auth, query, timezone, options) {
  const { sharedResults, useNamedData } = options
  const result = sharedResults[useNamedData]
  const dynamicColumns = result.dynamicColumns.filter(it => it.type === 'year')

  return {
    ...result,
    dynamicColumns,
  }
}

module.exports = {
  exportResults,
  getDeviceErrorHistoryForAttachment,
  columnsDeviceErrorHistoryForAttachment,
  getReportWorkloadSummary,
  getReportWorkloadSummaryByQuarter,
  getReportWorkloadSummaryByYear,
  getReportXdrDevicesSummary,
  getDataExtractReport,
  getAllResultsReport,
}
