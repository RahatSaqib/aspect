const flatten = require('flat')
const { subDays } = require('date-fns')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const locales = require('date-fns/locale')
const { endOfMonth, endOfYear, startOfMonth, subMonths, addMonths } = require('date-fns')

const { getResultsForExport } = require('../service')
const { knex } = require('../../db')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { exportData, getMaxLimitPlaceHolders, getBaseReplacements } = require('../../shared/excel')

const { getAllAssaySchemas } = require('../../assay/service')

const getReportXdrDevicesSummary = require('./xdrDevicesSummaryReport')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const { getGroupBy, getClinicalIndicatorQueryForResultsTable, processGroupedQuery } = require('../service')

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
async function getAllResultsForExport(auth, query) {
  const user = await getUser(auth.credentials.name)
  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // For performance issues we are going to limit this report to max 50k results.
  query.size = query.maxNumberOfRecords || 50000

  // For performance issues this enforce to use the result_partner_endedOn_index Index, because it helps to reduce query time down to  60%
  if (_.isNil(query.minDate)) query.minDate = subDays(new Date(query.maxDate), query.daysToSubstract || 360)

  const { data, extraColumns = [], total } = await getResultsForExport(auth, query)
  const { partnerId, id: userId } = user
  const props = { query, partnerId, userId }
  const columnsFromAssaySchema = await getColumnsFromAssaySchema(props)
  const columnsFromResultForms = await getColumnsFromResultForms(props)
  const columns = [
    ..._.map(extraColumns, column => ({
      key: column.db,
      header: column.title,
    })),
    // TODO: move below items to Excel template for better formatting and translations
    { key: 'deviceStateName', header: 'State' },
    { key: 'caseExternalId', header: 'Case ID' },
    { key: 'sampleId', header: 'Sample Id' },
    { key: 'sampleCollectedOn', header: 'Sample Collected Date' },
    { key: 'sampleOriginSiteName', header: 'Sample Collection Site' },
    { key: 'resultWorkflowStatus', header: 'Result Status' },
    { key: 'resultWorkflowChangedOn', header: 'Result Status Changed On' },
    { key: 'consumableSerial', header: 'Consumable Serial' },
    { key: 'consumableLot', header: 'Consumable Lot' },
    { key: 'consumableExpirationDate', header: 'Consumable Expiration Date' },
    { key: 'instrumentSerial', header: 'Instrument Serial' },
    { key: 'moduleName', header: 'Module' },
    { key: 'moduleSerial', header: 'Module Serial' },
    { key: 'researchId', header: 'Research ID' },
    { key: 'senderOperator', header: 'Operator' },
    { key: 'errorCode', header: 'Error Code' },
    { key: 'errorNotes', header: 'Error notes' },
    { key: 'notes', header: 'Notes' },
    { key: 'assayName', header: 'Assay' },
    // dynamic columns from different schema json fields
    ...columnsFromAssaySchema,
    ...columnsFromResultForms,
  ]
  if (extraColumns.length === 0) columns.splice(0, 0, { key: 'resultText', header: 'Result Text' })

  const dataset = {
    ok: true,
    total,
    length: _.get(data, 'length', 0),
    data,
    dynamicColumns: columns,
    dataSelector: (
      dataRow // if you need to transform your dataset to another format, you should pass the transformation function to avoid iterate twice the datasource.
    ) =>
      flatten({
        ...dataRow,
        patientData: JSON.parse(dataRow.patientData),
        resultData: JSON.parse(dataRow.resultData),
        formData: JSON.parse(dataRow.formData),
      }),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return dataset
}

// ----------------------------------------------------------------------------------------------
async function exportResults(request, reply) {
  const { query, auth } = request
  const { data, dynamicColumns, dataSelector, total } = await getAllResultsForExport(auth, query)
  const sheetData = {
    data,
    dynamicColumns,
    total,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'results', {
    replacements: [...getBaseReplacements(), ...getMaxLimitPlaceHolders()],
    dataSelector,
  })
}

async function getColumnsFromAssaySchema({ query, partnerId, userId }) {
  const columns = []
  const assaySchema = await getAllAssaySchemas(partnerId, userId, query.assayId)
  let resultData = {}
  let patientData = {}

  assaySchema.forEach(element => {
    if (element.patientDataSchema) {
      patientData = _.merge(patientData, JSON.parse(element.patientDataSchema))
    }
    if (element.resultDataSchema) {
      resultData = _.merge(resultData, JSON.parse(element.resultDataSchema))
    }
  })

  const flattenObjects = {
    ...flatten({ resultData }),
    ...flatten({ patientData }),
  }

  _.forEach(flattenObjects, (value, key) => {
    if (key.toLowerCase().indexOf('title') >= 0) {
      columns.push({
        header: value,
        key: key.replace('.title', '').replace('.properties', ''),
      })
    }
  })

  return columns
}

async function getColumnsFromResultForms({ partnerId }) {
  const columns = []
  const forms = await knex('ResultForm').where('partnerId', partnerId).pluck('formSchema')

  _.forEach(forms, formSchema => {
    _.forEach(JSON.parse(formSchema).fields, (value, key) => {
      if (value && (_.isNil(value.excludeReport) || !value.excludeReport) && value.name) {
        columns.push({
          header: value.name,
          key: key.replace('.title', '').replace('.properties', ''),
        })
      }
    })
  })
  return columns
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
  const resultQuery = getClinicalIndicatorQueryForResultsTable(dataConstraints, assay, groupBy, query)

  let data = await processGroupedQuery(resultQuery, groupBy)
  data = _.filter(data, it => !!it.state && it.state !== 'null')
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
      const { state, month, cnt, resultCategory1, resultCategory2 } = item
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
async function getReportWorkloadSummaryByQuarter(auth, query, options) {
  const { sharedResults, useNamedData } = options
  const result = sharedResults[useNamedData]
  const dynamicColumns = result.dynamicColumns.filter(it => it.type === 'quarter' || it.type === 'year')

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
  exportResults,
  getDeviceErrorHistoryForAttachment,
  getAllResultsForExport,
  columnsDeviceErrorHistoryForAttachment,
  getReportWorkloadSummary,
  getReportWorkloadSummaryByQuarter,
  getReportWorkloadSummaryByYear,
  getReportXdrDevicesSummary,
}
