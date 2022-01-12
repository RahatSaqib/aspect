const flatten = require('flat')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const { endOfMonth, startOfMonth } = require('date-fns')

const { addConstraints, getConstraints } = require('../auth/constraints')
const { getResultsForExport } = require('./service')
const { knex, filterParams, filterDateRangeParams } = require('../db')
const { getUser } = require('../auth/service')
const { exportData, getBaseReplacements } = require('../shared/excel')
const {
  formatDateOrDefault,
  getWellFormattedDateStringWithTimezone,
  startOfMonthUTC,
  endOfMonthUTC,
} = require('../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../resultCategory/service')
const { getAllAssaySchemas } = require('../assay/service')
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
  // do not export more than 1.000.000 records
  query.size = 10e6
  const { data, extraColumns = [] } = await getResultsForExport(auth, query)
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
  if (extraColumns.length === 0)
    columns.splice(0, 0, { key: 'resultText', header: 'Result Text' })

  const dataset = {
    ok: true,
    total: _.get(data, 'length', 0),
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
  const { data, dynamicColumns, dataSelector } = await getAllResultsForExport(
    auth,
    query
  )
  const sheetData = {
    dataRows: data,
    dynamicColumns,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'results', {
    replacements: getBaseReplacements(),
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
  const forms = await knex('ResultForm')
    .where('partnerId', partnerId)
    .pluck('formSchema')

  _.forEach(forms, formSchema => {
    _.forEach(JSON.parse(formSchema).fields, (value, key) => {
      if (
        value &&
        (_.isNil(value.excludeReport) || !value.excludeReport) &&
        value.name
      ) {
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
  const filterUntilDate = (
    queryBuilder,
    untilDate,
    fieldName = 'r.endedOn'
  ) => {
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
      knex.raw(
        `ifnull(convert_tz(r.endedOn, '+00:00', tz.timeZone), r.endedOn) as dateTime`
      ), // 1. Test Date/time in device time
      'r.endedOn as actualDateTime', // 2. Actual Date/Time
      'r.instrumentSerial', // 3. Instrument Serial Number
      knex.raw(
        `ifnull(r.resultData ->> '$.systemName', d.configurationData ->> '$.systemName') as gxSystemName`
      ), // 4. GX System Name
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
          knex.raw(
            `convert_tz(do.startedOn, tz.timeZone, '+00:00') as actualDateTime`
          ),
          knex.raw(`'-' as instrumentSerial`),
          knex.raw(
            `ifnull(d.configurationData ->> '$.systemName', '-') as gxSystemName`
          ),
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
    .orderBy('dateTime', 'asc')

  // fix hardware entries, if any
  // eslint-disable-next-line no-constant-condition
  if ((_.some(items), { source: 'System Log' })) {
    // for hardware errors, we don't have senderversion or module serial, only module name -> get all serials by slot along with instrument serial and sender version by max result date
    const missingFields = [
      'r.moduleName',
      'r.moduleSerial',
      'r.instrumentSerial',
      'r.senderVersion',
    ]
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
        return (
          r.endedOn <= i.dateTime &&
          r.moduleSerial &&
          r.moduleName === i.moduleName
        )
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

async function getDataForReportDrTb10A(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const {
    stateId,
    lgaId,
    siteName,
    minDate: minDateStr = getWellFormattedDateStringWithTimezone(
      startOfMonth(new Date())
    ),
    maxDate: maxDateStr = getWellFormattedDateStringWithTimezone(
      endOfMonth(new Date())
    ),
  } = query
  const dateFrom = startOfMonthUTC(minDateStr)
  const dateTo = endOfMonthUTC(maxDateStr)

  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()
  const positiveResultCategories = _.values(
    _.pick(resultCategoryIds, getPositiveCategoriesExternalIds())
  )
  const mtbDetected = `
    r.resultCategory1 IN (${positiveResultCategories})
  `
  const rifDetected = `
    r.resultCategory1 IN (${positiveResultCategories})
    and
    r.resultCategory2 IN (${positiveResultCategories})
  `
  const count = (id, condition) =>
    knex.raw(`
        DISTINCT
        CASE
          WHEN ${condition}
          THEN ${id}
          ELSE null
        END
      `)
  const countCustomField = (condition, customFieldName, customFieldValue) =>
    count(
      'r.id',
      `
        ${condition}
        ${condition ? ' and ' : ''}
        IFNULL(r.patientData ->> '$.${customFieldName}', '') = '${customFieldValue}'
      `
    )

  // get total results per each device per period
  let data = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    /**
     * join to `DeviceCapacity` to count number of modules per device
     */
    .leftOuterJoin('DeviceCapacity as dc', 'd.deviceCapacityId', 'dc.id')
    .leftJoin('ResultCategoryAssay as rca1', function () {
      this.on('r.assayId', 'rca1.assayId').andOn(
        'r.resultCategory1',
        'rca1.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.assayId', 'rca2.assayId').andOn(
        'r.resultCategory2',
        'rca2.resultCategoryId'
      )
    })
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
      result: 'r',
    })
    .modify(
      filterDateRangeParams,
      { minDate: dateFrom, maxDate: dateTo },
      'r.endedOn'
    )
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .select(
      'r.deviceId',
      knex.raw(`
        DATE_FORMAT(r.endedOn, "%Y-%m-01") as yearAndMonth
      `),
      /**
       * Notice that we below group by `deviceId`
       * only because we need to count number of modules
       * for each device
       */
      knex.raw(`
        ROUND(IFNULL(dc.dailyCapacity, 12) / 3, 0) as cntModules
      `)
    )
    .groupBy('yearAndMonth', 'r.deviceId')
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
      /**
       * Block 1
       */
      cntInvalid: count(
        'r.id',
        `r.resultCategory1 = ${resultCategoryIds.Invalid}`
      ),
      cntNoResult: count(
        'r.id',
        `r.resultCategory1 = ${resultCategoryIds.NoResult}`
      ),
      cntError: count('r.id', `r.resultCategory1 = ${resultCategoryIds.Error}`),
      cntMtbDetectedRifIndeterminate: count(
        'r.id',
        `
          r.resultCategory1 IN (${positiveResultCategories})
          and
          r.resultCategory2 = ${resultCategoryIds.Indeterminate}
        `
      ),
      /**
       * Block 2
       */
      cntMtbRifUnknownHistory: countCustomField(
        '',
        'TBHistory',
        'Unknown History'
      ),
      cntMtbRifNewTest: countCustomField('', 'TBHistory', 'New Test'),
      cntMtbDetectedUnknownHistory: countCustomField(
        mtbDetected,
        'TBHistory',
        'Unknown History'
      ),
      cntRifDetectedUnknownHistory: countCustomField(
        rifDetected,
        'TBHistory',
        'Unknown History'
      ),
      cntMtbDetectedNewTest: countCustomField(
        mtbDetected,
        'TBHistory',
        'New Test'
      ),
      cntRifDetectedNewTest: countCustomField(
        rifDetected,
        'TBHistory',
        'New Test'
      ),

      cntModulesActive: knex.raw(`DISTINCT 
        CONCAT(r.deviceId, '-',  r.moduleName)
      `),
    })

  data = _.reduce(
    data, // <-- this `data` is grouped by 'yearAndMonth' and 'deviceId'
    (acc, { deviceId, yearAndMonth, ...rest }) => {
      /**
       * Notice that above prop `rest` contains counter props
       * only, i.e. name starts with `cnt`
       */
      let item = acc[yearAndMonth]
      const propNames = _.keys(rest) // i.e. all counters `cnt*`
      if (!item) {
        item = {
          devices: {}, // this is a temporal prop to collect distinct deviceId's
        }
        propNames.forEach(propName => {
          item[propName] = 0
        })
      }
      /**
       * increment all counters
       */
      propNames.forEach(propName => {
        item[propName] += rest[propName]
      })
      /**
       * keep `deviceId`, we need only object keys
       */
      item.devices[deviceId] = null

      acc[yearAndMonth] = item
      return acc
    },
    {}
  )

  const yymm = formatDateOrDefault(dateFrom, 'yyyy-MM-01') // same format as field `yearAndMonth` in query
  /**
   * set `data` to single object with all counters prepared
   */
  data = data[yymm] || {}
  /**
   * set `cntDevices` and remove temporal prop `devices`
   */
  if (!_.isEmpty(data)) {
    data.cntDevices = _.keys(data.devices).length
  }
  delete data.devices
  /**
   * additional props
   */
  data.month = dateFormat(dateFrom, 'MMMM')
  data.quarter = dateFormat(dateFrom, 'qo')
  data.year = +dateFormat(dateFrom, 'yyyy')
  data.today = formatDateOrDefault(new Date(), 'yyyy-MM-dd')

  data.stateName = 'All'
  data.lgaName = 'All'
  data.siteName = siteName || 'All'
  if (stateId) {
    ;[{ name: data.stateName }] = await knex('State')
      .where('id', stateId)
      .select('name')
  }
  if (lgaId) {
    ;[{ name: data.lgaName }] = await knex('Lga')
      .where('id', lgaId)
      .select('name')
  }

  return {
    ok: true,
    data,
  }
}

module.exports = {
  exportResults,
  getDeviceErrorHistoryForAttachment,
  getAllResultsForExport,
  columnsDeviceErrorHistoryForAttachment,
  getDataForReportDrTb10A,
}
