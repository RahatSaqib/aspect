const path = require('path')
const { listReports } = require('./service')
const { format } = require('date-fns')
const {
  generateReport,
  downloadReportFile,
} = require('../excelreports/excelManager')

async function getReport(request, reply) {
  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const reports = await listReports(request)
  const { query } = request
  const reportFile = path.join(
    __dirname,
    '../excelreports/reportTemplates/Reports.xlsx'
  )
  const report = generateReport(
    query.format, // xlsx or csv
    reportFile, // the path to the exceltemplate
    '<Headers>', // This is an invented tag to look for, in the report template, for selecting the first cell we want to work with.
    // Also we can find a text for a header instead of create a place holder.
    reports.data,
    // this is the data source to create the reportvalues.
    // It should be an Array of JSON objects, where each must be plained (Without nested properties)
    {
      date: format(new Date(), 'yyyy-MM-dd'),
    }, // the json object to replace values in the header.
    2 // If the function locate the row number for the placeholder,
    // how many rows after appears the placeholders for the values (default 0)
  )
  return downloadReportFile(report, reply, request.format)
}
module.exports = {
  getReport,
}
