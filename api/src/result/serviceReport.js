const flatten = require('flat')
const _ = require('lodash')
const { getResultsForExport } = require('./service')
const { knex } = require('../db')
const { getUser } = require('../auth/service')
const { exportData, getBaseReplacements } = require('../shared/excel')

const {
  generateWorkbookByDataSource,
  downloadReportFile,
} = require('../excelreports/excelManager')
const { getAllAssaySchemas } = require('../assay/service')

const headers = [
  { key: 'endedOn', header: 'Test Date' },
  { key: 'stateName', header: 'State' },
  { key: 'lgaName', header: 'LGA' },
  { key: 'siteName', header: 'Site' },
  { key: 'deviceName', header: 'Device' },
  { key: 'patientId', header: 'Patient Id' },
  { key: 'caseExternalId', header: 'Case ID' },
  { key: 'sampleId', header: 'Sample Id' },
  { key: 'sampleCollectedOn', header: 'Sample Collected Date' },
  { key: 'sampleOriginSiteName', header: 'Sample Collection Site' },
  { key: 'resultCategory1Name', header: 'Result category 1' },
  { key: 'resultCategory2Name', header: 'Result category 2' },
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
]
async function getResultsReport(request, reply) {
  const { query, auth } = request

  const user = await getUser(auth.credentials.name)
  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 1.000.000 records
  query.size = 10e6
  const results = await getResultsForExport(query, auth)

  // / this is for generate the headers and key for each row.
  await getAssaySchema(query, user.partnerId, user.id, headers)
  await getResultFormData(user.partnerId, headers)
  const report = generateWorkbookByDataSource(
    query.format, // xlsx or csv
    results.data,
    'Results',
    headers,
    'Aspect Results',
    (
      elem // if you need to transform your dataset to another format, you should pass the transformation function to avoid iterate twice the datasource.
    ) =>
      flatten({
        ...elem,
        patientData: JSON.parse(elem.patientData),
        resultData: JSON.parse(elem.resultData),
        formData: JSON.parse(elem.formData),
      })
  )
  return downloadReportFile(report, reply, request.format)
}

async function getAssaySchema(query, partnerId, userId, headers) {
  const assaySchema = await getAllAssaySchemas(partnerId, userId, query.assayId)
  let resultSchema = {}
  let patientSchema = {}
  assaySchema.forEach(element => {
    if (element.patientDataSchema)
      patientSchema = _.merge(
        patientSchema,
        JSON.parse(element.patientDataSchema)
      )
    if (element.resultDataSchema)
      resultSchema = _.merge(resultSchema, JSON.parse(element.resultDataSchema))
  })
  const flattenObjects = {
    ...flatten({ resultData: filterExcluded(resultSchema) }),
    ...flatten({ patientData: filterExcluded(patientSchema) }),
  }
  _.forEach(flattenObjects, (value, key) => {
    if (key.toLowerCase().indexOf('title') >= 0)
      headers.push({
        header: value,
        key: key.replace('.title', '').replace('.properties', ''),
      })
  })
}

async function getResultFormData(partnerId, headers) {
  const formSchema = await knex('ResultForm')
    .where('partnerId', partnerId)
    .select('formSchema')
  const existingResultForm = formSchema
  _.forEach(existingResultForm, value => {
    _.forEach(JSON.parse(value.formSchema).fields, (value, key) => {
      if (
        value &&
        (_.isNil(value.excludeReport) || !value.excludeReport) &&
        value.name
      )
        headers.push({
          header: value.name,
          key: key.replace('.title', '').replace('.properties', ''),
        })
    })
  })
}
// Add field excludeReport in the json metadata of the custom fields
// if you don't want add this field to the report.
const filterExcluded = collection =>
  _.filter(
    collection,
    elem => elem && (_.isNil(elem.excludeReport) || !elem.excludeReport)
  )

// ----------------------------------------------------------------------------------------------
async function exportResults(request, reply) {
  const { query, auth } = request

  const user = await getUser(auth.credentials.name)
  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 1.000.000 records
  query.size = 10e6
  const { data } = await getResultsForExport(query, auth)

  const { partnerId, id: userId } = user
  const props = { query, partnerId, userId }
  const columnsFromAssaySchema = await getColumnsFromAssaySchema(props)
  const columnsFromResultForms = await getColumnsFromResultForms(props)
  const columns = [
    // TODO: move below items to Excel template for better formatting and translations
    { key: 'caseExternalId', header: 'Case ID' },
    { key: 'sampleId', header: 'Sample Id' },
    { key: 'sampleCollectedOn', header: 'Sample Collected Date' },
    { key: 'sampleOriginSiteName', header: 'Sample Collection Site' },
    { key: 'resultCategory1Name', header: 'Result category 1' },
    { key: 'resultCategory2Name', header: 'Result category 2' },
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

  const sheetData = {
    dataRows: data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'results', {
    replacements: getBaseReplacements(),
    columns,
    dataSelector: (
      dataRow // if you need to transform your dataset to another format, you should pass the transformation function to avoid iterate twice the datasource.
    ) =>
      flatten({
        ...dataRow,
        patientData: JSON.parse(dataRow.patientData),
        resultData: JSON.parse(dataRow.resultData),
        formData: JSON.parse(dataRow.formData),
      }),
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
  /**
   * for current device
   *
   * select errors from Result table
   */
  const resultCategories = ['Error', 'Invalid', 'NoResult']
  const items = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftOuterJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where('r.deviceId', deviceId)
    .where('r.endedOn', '>=', minDate)
    .where('r.endedOn', '<=', maxDate)
    .where(function () {
      // get only errors and invalids
      this.whereNotNull('r.errorCode')
        .orWhereIn('rc1.externalId', resultCategories)
        .orWhereIn('rc2.externalId', resultCategories)
    })
    .select(
      knex.raw('"Assay" as source'),
      /**
       * see list of all columns for CSV file in 2nd tab
       * of Excel file attached to https://ops.systemone.id/browse/ASP-1857
       */
      'r.endedOn as dateTime', // 1. Test Date/time
      'r.createdOn as actualDateTime', // 2. Actual Date/Time
      'r.instrumentSerial', // 3. Instrument Serial Number
      knex.raw(`(r.resultData ->> '$.systemName') as gxSystemName`), // 4. GX System Name
      'r.senderVersion as gxSoftwareVersion', // 5. GX Software Version
      knex.raw(`'-' as gatewaySerial`), // 6. Instrument Gateway Serial Number
      'r.moduleSerial', // 7. Module Serial Number
      'a.name as cartridgeType', // 8. Cartridge Name
      'r.consumableLot as cartridgeLot', // 9. Cartridge Lot
      'r.consumableSerial as cartridgeSerial', // 10. Cartridge Serial Number
      'r.senderOperator as operatorId', // 12. Operator ID
      // 13. Test Outcome
      knex.raw(`
        CASE
        WHEN rc1.externalId IN ('Error', 'Invalid', 'NoResult') THEN rc1.externalId
        ELSE 'Success'
        END as result
      `),
      'r.errorCode', // 14. Error Code
      /**
       * additional fields
       */
      'a.abbreviation as assay',
      'r.moduleName'
    )
    .union([
      /**
       * select hardware errors from DeviceOperation table
       */
      knex('DeviceOperation as do')
        // join to get recent Result entry for device (of any assay type)
        .leftOuterJoin('Result as r', function () {
          this.on('r.deviceId', 'do.deviceId').andOn(
            'r.endedOn',
            '<',
            'do.startedOn'
          )
        })
        // join again to Result to make sure we get latest entry for above join of alias 'r'
        .leftOuterJoin('Result as rNewer', function () {
          this.on('r.deviceId', 'rNewer.deviceId')
            .andOn('rNewer.endedOn', '<', 'do.startedOn')
            .andOn(function () {
              this.on('r.endedOn', '<', 'rNewer.endedOn')
              this.orOn(function () {
                this.on('r.endedOn', '=', 'rNewer.endedOn').andOn(
                  'r.id',
                  '<',
                  'rNewer.id'
                )
              })
            })
        })
        .where('do.deviceId', deviceId)
        .where('do.startedOn', '>=', minDate)
        .where('do.startedOn', '<=', maxDate)
        .whereNull('rNewer.id') // must be null to get single latest Result entry for alias 'r'
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
          knex.raw(`null as actualDateTime`),
          'r.instrumentSerial',
          knex.raw(`
            CASE
            WHEN r.resultData IS NOT NULL THEN r.resultData ->> '$.systemName'
            ELSE ''
            END as gxSystemName
          `),
          'r.senderVersion as gxSoftwareVersion',
          knex.raw(`'-' as gatewaySerial`),
          knex.raw(`'-' as moduleSerial`),
          knex.raw(`'-' as cartridgeType`),
          knex.raw(`'-' as cartridgeLot`),
          knex.raw(`'-' as cartridgeSerial`),
          'r.senderOperator as operatorId',
          knex.raw(`'-' as result`),
          knex.raw(`do.data ->> '$.details.Errors[0].ErrorCode' as errorCode`),
          knex.raw(`'-' as assay`),
          // treat all words A1..D4 as moduleName
          knex.raw(`
            REGEXP_SUBSTR(do.data ->> '$.details.RawText', '[A-D][1-4]') as moduleName
          `)
        ),
    ])
    .orderBy('dateTime', 'asc')

  /**
   * 'header' is for 1st row in CSV file,
   * 'key' is prop name in array 'items'
   */
  const columns = [
    { header: 'Source', key: 'source' },
    { header: 'Date/Time', key: 'dateTime' },
    { header: 'Actual Date/Time', key: 'actualDateTime' },
    { header: 'Instrument Serial Number', key: 'instrumentSerial' },
    { header: 'GX System Name', key: 'gxSystemName' },
    { header: 'GX Software Version', key: 'gxSoftwareVersion' },
    { header: 'Instrument Gateway Serial Number', key: 'gatewaySerial' },
    { header: 'Module Position', key: 'moduleName' },
    { header: 'Module Serial Number', key: 'moduleSerial' },
    { header: 'Assay', key: 'assay' },
    { header: 'Cartridge Type', key: 'cartridgeType' },
    { header: 'Cartridge Lot', key: 'cartridgeLot' },
    { header: 'Cartridge Serial Number', key: 'cartridgeSerial' },
    { header: 'Operator ID', key: 'operatorId' },
    { header: 'Test Outcome', key: 'result' },
    { header: 'Error Code', key: 'errorCode' },
  ]
  return {
    items,
    columns,
  }
}

module.exports = {
  exportResults,
  getResultsReport,
  getDeviceErrorHistoryForAttachment,
}
