const _ = require('lodash')
const dateFormat = require('date-fns/format')
const locales = require('date-fns/locale')
const {
  endOfMonth,
  endOfYear,
  startOfMonth,
  subMonths,
  addMonths,
} = require('date-fns')

const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const {
  getGroupBy,
  getClinicalIndicatorQueryForResultsTable,
  processGroupedQuery,
} = require('../service')

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
  const { culture } = await getUser(auth.credentials.name)
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
  const resultQuery = getClinicalIndicatorQueryForResultsTable(
    dataConstraints,
    assay,
    groupBy,
    query
  )

  let data = await processGroupedQuery(resultQuery, groupBy)
  data = _.filter(data, it => !!it.state && it.state !== 'null')
  data = _.sortBy(data, ['state', 'month'])

  /**
   * count all numbers (via formating data as object)
   * {
   *  [state]: {
   *    [month]: {
   *      total: ###,
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
      const { state, month, cnt, resultCategory1, resultCategory2 } = item
      acc[state] = acc[state] || {}
      acc[state][month] = acc[state][month] || { ...emptyCounts }
      acc[state][month][SECTION_KEY_ALL] += cnt
      if (positiveResultCategories.includes(resultCategory1)) {
        acc[state][month][SECTION_KEY_MTB] += cnt
      }
      if (
        positiveResultCategories.includes(resultCategory1) &&
        positiveResultCategories.includes(resultCategory2)
      ) {
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
  /**
   * define final `data` object for report
   */
  data = {}
  // for each section ...
  sectionKeys.forEach(sectionKey => {
    // start section data with empty array of rows
    data[sectionKey] = []
    // for each `state` ...
    _.forEach(obj, (months, state) => {
      const row = { state }
      // 1. process all fetched months
      _.forEach(months, (item, month) => {
        row[month] = item[sectionKey]
      })
      // 2. process all quarters
      _.forEach(dynamicQuarterColumns, quarterColumn => {
        sumAllMonths(row, quarterColumn)
      })
      // 3. process all years
      _.forEach(dynamicYearColumns, yearColumn => {
        sumAllMonths(row, yearColumn)
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
        title: 'All Tests',
        totalsLocation: 'top',
      },
      {
        dataSource: SECTION_KEY_MTB,
        title: 'MTB+',
        totalsLocation: 'top',
      },
      {
        dataSource: SECTION_KEY_RRD,
        title: 'RRD',
        totalsLocation: 'top',
      },
    ],
  }
}

// ------------------------------------------------------
async function getReportWorkloadSummaryByQuarter(auth, query, options) {
  const { sharedResults, useNamedData } = options
  const result = sharedResults[useNamedData]
  const dynamicColumns = result.dynamicColumns.filter(
    it => it.type === 'quarter' || it.type === 'year'
  )

  return {
    ...result,
    dynamicColumns,
  }
}

// ------------------------------------------------------
async function getReportWorkloadSummaryByYear(auth, query, options) {
  const { sharedResults, useNamedData } = options
  const result = sharedResults[useNamedData]
  const dynamicColumns = result.dynamicColumns.filter(it => it.type === 'year')

  return {
    ...result,
    dynamicColumns,
  }
}

module.exports = {
  getReportWorkloadSummary,
  getReportWorkloadSummaryByQuarter,
  getReportWorkloadSummaryByYear,
}
