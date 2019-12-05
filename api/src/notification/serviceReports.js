const _ = require('lodash')
const path = require('path')
const { format } = require('date-fns')
const { listNotifications } = require('./service')
const {
  generateReport,
  downloadReportFile,
} = require('../excelreports/excelManager')

const issues = {
  issueCategoryDeviceHealth: 'Device',
  issueCategoryReagentHealth: 'Reagent',
  issueCategoryDataHealth: 'Data',
  issueCategoryConnectivityHealth: 'Connectivity',
}
async function generateNotificationsReport(request, reply) {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, query, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const devices = await listNotifications(request)
  const { query } = request
  const reportFile = path.join(
    __dirname,
    '../excelreports/reportTemplates/Notifications.xlsx'
  )
  const report = generateReport(
    query.format, // xlsx or csv
    reportFile, // the path to the exceltemplate
    '<Headers>', // This is an invented tag to look for, in the report template, for selecting the first cell we want to work with.
    // Also we can find a text for a header instead of create a place holder.
    _.map(
      devices.data,
      elem =>
        Object.assign(
          {
            issuesCategories: _.map(
              elem.issueCategories,
              current => issues[current.key]
            )
              .join(',')
              .replace('[')
              .replace(']'),
          },
          elem
        )
      // this is the data source to create the reportvalues.
      // It should be an Array of JSON objects, where each must be plained (Without nested properties)
    ),
    {
      date: format(new Date(), 'yyyy-MM-dd'),
    }, // the json object to replace values in the header.
    2 // If the function locate the row number for the placeholder,
    // how many rows after appears the placeholders for the values (default 0)
  )
  return downloadReportFile(report, reply, request.format)
}
module.exports = {
  generateNotificationsReport,
}
