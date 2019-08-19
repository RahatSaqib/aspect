const { exportResults } = require('./service')
const flatten = require('flat')
const _ = require('lodash')
const { knex } = require('../db')
const { getUser } = require('../auth/service')

const {
  generateWorkbookByDataSource,
  downloadReportFile,
} = require('../excelreports/excelManager')
const { getAllAssaySchemas } = require('../assay/service')

const headers = [
  { key: 'startedOn', header: 'Test Start Date' },
  { key: 'endedOn', header: 'Test End Date' },
  { key: 'deviceName', header: 'Device' },
  { key: 'deviceSerial', header: 'Device Serial #' },
  { key: 'countryName', header: 'Country' },
  { key: 'stateName', header: 'State' },
  { key: 'lgaName', header: 'LGA' },
  { key: 'resultCategory1Name', header: 'Result category 1' },
  { key: 'resultCategory2Name', header: 'Result category 2' },
  { key: 'resultWorkflowStatus', header: 'Result Status' },
  { key: 'resultWorkflowChangedOn', header: 'Result Status date' },
  { key: 'resultTreatmentStatus', header: 'Result Treatment Status' },
  { key: 'siteName', header: 'Site' },
  { key: 'assayVersion', header: 'Assay Version' },
  { key: 'consumableSerial', header: 'Consumable Serial' },
  { key: 'consumableLot', header: 'Consumable Lot' },
  { key: 'consumableExpirationDate', header: 'Consumable Expiration Date' },
  { key: 'instrumentSerial', header: 'Instrument Serial' },
  { key: 'moduleName', header: 'Module' },
  { key: 'moduleSerial', header: 'Module Serial' },
  { key: 'researchId', header: 'Research Id' },
  { key: 'senderVersion', header: 'Sender Version' },
  { key: 'senderOperator', header: 'Operator' },
  { key: 'notes', header: 'Notes' },
  { key: 'errorCode', header: 'Error Code' },
  { key: 'errorNotes', header: 'Error notes' },
  { key: 'createdOn', header: 'Error date' },
  { key: 'sampleId', header: 'Sample Id' },
  { key: 'sampleGroup', header: 'Sample Group' },
  { key: 'sampleCollectedOn', header: 'sample collected Date' },
  { key: 'sampleOriginSiteName', header: 'Sample origin site' },
  { key: 'sampleTypeName', header: 'Sample type' },
  { key: 'patientId', header: 'Patient Id' },
  { key: 'requiresTreatment', header: 'Requires Treatment' },
  { key: 'resultWorkflowLogReason', header: 'Result Reason' },
  { key: 'resultWorkflowLogOperator', header: 'Result Log Operator' },
  { key: 'resultWorkflowLogCreatedOn', header: 'Result Log date' },
  { key: 'resultTreatmentMethod', header: 'Result Treatment Method' },
  { key: 'resultTreatmentData', header: 'Result Treatment Data' },
  {
    key: 'resultTreatmentStatusChangedOn',
    header: 'Result Treatment status date',
  },
  { key: 'treatmentStatusInfo', header: 'Treatment status info' },
]
async function getResultsReport(request, reply) {
  console.log('ejecuto')
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, query, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.
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
  await getAssaySchema(query, user.partnerId, headers)
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
async function getAssaySchema(query, partnerId, headers) {
  const assaySchema = await getAllAssaySchemas(partnerId, query.assayId)
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
const filterExcluded = collection =>
  _.filter(
    collection,
    elem => elem && (_.isNil(elem.excludeReport) || !elem.excludeReport)
  )

module.exports = {
  getResultsReport,
}
