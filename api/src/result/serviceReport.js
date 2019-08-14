const { listResults } = require('./service')
const flatten = require('flat')
const _ = require('lodash')
const {
  generateWorkbookByDataSource,
  downloadReportFile,
} = require('../excelreports/excelManager')
const { getAllAssaySchemas } = require('../assay/service')

async function getResultsReport(request, reply) {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, query, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.
  const { query, auth } = request
  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 10
  const results = await listResults(request, true)
  const data = _.map(results.data, elem =>
    flatten({
      ...elem,
      patientData: JSON.parse(elem.patientData),
      resultData: JSON.parse(elem.resultData),
    })
  )
  const assaysMetadata = await getAssaySchema(request)
  const headers = []
  _.forEach(_.sample(data), (value, key) =>
    headers.push({
      header: key,
      key: key.replace('.title', '').replace('.properties', ''),
    })
  )
  _.forEach(assaysMetadata, (value, key) => {
    if (key.toLowerCase().indexOf('title') >= 0)
      headers.push({
        header: value,
        key: key.replace('.title', '').replace('.properties', ''),
      })
  })
  console.log(headers)

  console.log(_.sample(data))
  const report = generateWorkbookByDataSource(
    query.format, // xlsx or csv
    data,
    'Results',
    headers
  )
  return downloadReportFile(report, reply, request.format)
}
async function getAssaySchema(request) {
  const assaySchema = await getAllAssaySchemas(request)
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
  return {
    ...flatten({ resultData: resultSchema }),
    ...flatten({ patientData: patientSchema }),
  }
}
module.exports = {
  getResultsReport,
}
