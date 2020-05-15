const flatten = require('flat')
const _ = require('lodash')
const { exportResults } = require('./service')
const { knex } = require('../db')
const { getUser } = require('../auth/service')

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
  const results = await exportResults(query, auth)

  // / this is for generate the headers and key for each row.
  await getAssaySchema(query, user.partnerId, user.id, headers)
  await getResultFormData(user.partnerId, headers)
  const report = generateWorkbookByDataSource(
    query.format, // xlsx or csv
    results.data,
    'Results',
    headers,
    'Aspect Results',
    elem => // if you need to transform your dataset to another format, you should pass the transformation function to avoid iterate twice the datasource.
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

module.exports = {
  getResultsReport,
}
