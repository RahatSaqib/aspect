const { listResults } = require('./service')
const flatten = require('flat')
const _ = require('lodash')
const path = require('path')
const {
  generateWorkbookByDataSource,
  downloadReportFile,
} = require('../excelreports/excelManager')
// const { listAssaysResultSchema } = require('../assay/service')

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
  const reportFile = path.join(
    __dirname,
    '../excelreports/reportTemplates/Results.xlsx'
  )
  const data = _.map(results.data, elem =>
    flatten(
      Object.assign(
        {},
        elem,
        {
          patientData: JSON.parse(elem.patientData),
          resultData: JSON.parse(elem.resultData),
        }
        // flatten(elem.formtData)
      )
    )
  )
  console.log('----------------------')

  const elem = _.sample(data)
  console.log(elem)

  // const assaySchema = listAssaysResultSchema(request)
  const report = generateWorkbookByDataSource(
    query.format, // xlsx or csv
    data,
    'Results'
  )
  return downloadReportFile(report, reply, request.format)
}

module.exports = {
  getResultsReport,
}
