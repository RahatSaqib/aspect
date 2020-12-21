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
  const items = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftOuterJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where('r.deviceId', deviceId)
    .where('r.endedOn', '>=', minDate)
    .where('r.endedOn', '<=', maxDate)
    .where(function () {
      // get only errors
      this.whereNotNull('r.errorCode')
        .orWhere('rc1.externalId', 'Error')
        .orWhere('rc2.externalId', 'Error')
    })
    .select(
      'a.abbreviation as assay',
      'r.consumableLot as lot',
      'r.moduleName',
      'r.endedOn as dateTime',
      'rc1.externalId as result',
      'r.errorCode'
    )
    .union([
      /**
       * select hardware errors from DeviceOperation table
       */
      knex('DeviceOperation')
        .where('deviceId', deviceId)
        .where('startedOn', '>=', minDate)
        .where('startedOn', '<=', maxDate)
        // JSON prop type='gx-log' marks entry received from GxConnect as GeneXpert log
        .whereRaw(`IFNULL(data ->> '$.type', '') = 'gx-log'`)
        /**
         * JSON array details.Errors should contain some error code
         * Notice that below we get entries with any error code (grabbed
         * from GeneXpert logs).
         * Easy to narrow, if we need, to only some set of error codes.
         */
        .whereRaw(`IFNULL(data ->> '$.details.Errors[0].ErrorCode', 0) > 0`)
        .select(
          knex.raw('"Hardware" as assay'),
          knex.raw(`'-' as lot`),
          knex.raw(`'-' as moduleName`),
          'startedOn as dateTime',
          knex.raw(`'-' as result`),
          knex.raw(`data ->> '$.details.Errors[0].ErrorCode'`)
        ),
    ])
    .orderBy('dateTime', 'desc')

  const columns = [
    { header: 'Assay', key: 'assay' },
    { header: 'Module Name', key: 'moduleName' },
    { header: 'Lot', key: 'lot' },
    { header: 'Date/Time', key: 'dateTime' },
    { header: 'Result', key: 'result' },
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
