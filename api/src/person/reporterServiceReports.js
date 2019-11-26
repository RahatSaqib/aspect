const path = require('path')
const { listRefreshTokens } = require('./service')
const { format } = require('date-fns')
const _ = require('lodash')
const {
  generateReport,
  downloadReportFile,
} = require('../excelreports/excelManager')

async function getReport(request, reply) {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, query, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const reports = await listRefreshTokens(request)
  const { query } = request
  const reportFile = path.join(
    __dirname,
    '../excelreports/reportTemplates/Reporters.xlsx'
  )
  const report = generateReport(
    query.format, // xlsx or csv
    reportFile, // the path to the exceltemplate
    '<Headers>', // This is an invented tag to look for, in the report template, for selecting the first cell we want to work with.
    // Also we can find a text for a header instead of create a place holder.
    _.map(
      reports.data,
      elem =>
        Object.assign(elem, {
          acknowledgedRatio: _.round(elem.acknowledgedRatio * 100),
          confirmFollowUpRatio: _.round(elem.confirmFollowUpRatio * 100),
        })
      // this is the data source to create the reportvalues.
      // It should be an Array of JSON objects, where each must be plained (Without nested properties)
    ),
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
