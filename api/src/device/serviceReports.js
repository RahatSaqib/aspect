const _ = require('lodash')
const path = require('path')
const { format } = require('date-fns')
const { listDevices } = require('./service')
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
async function getDevicesReport(request, reply) {
  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const devices = await listDevices(request)
  const { query } = request
  const [devicesData] = devices.data
  const reportFile = path.join(
    __dirname,
    `../excelreports/reportTemplates/${
      devicesData.category !== 'Router' ? 'Devices.xlsx' : 'Routers.xlsx'
    }`
  )

  const report = generateReport(
    query.format, // xlsx or csv
    reportFile, // the path to the exceltemplate
    '<Headers>', // This is an invented tag to look for, in the report template, for selecting the first cell we want to work with.
    // Also we can find a text for a header instead of create a place holder.
    devicesData.category !== 'Router'
      ? _.map(
          devices.data,
          elem =>
            Object.assign(
              {
                availabilityRate: elem.availability.rate * 100,
                issuesCategories: _.map(
                  elem.issueCategories,
                  current => issues[current.key]
                )
                  .join(',')
                  .replace('[')
                  .replace(']'),
                errorRate: elem.error.rate * 100,
              },
              elem
            )
          // this is the data source to create the reportvalues.
          // It should be an Array of JSON objects, where each must be plained (Without nested properties)
        )
      : _.map(devices.data, elem =>
          Object.assign(elem, {
            lastSeen: format(new Date(elem.lastSeen), 'yyyy-MM-dd HH:mm:ss'),
          })
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
  getDevicesReport,
}
