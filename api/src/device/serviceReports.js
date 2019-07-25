const _ = require('lodash')
const path = require('path')
const { listDevices } = require('./service')
const { format } = require('date-fns')
const { generateReport } = require('../excelreports/excelManager')

const issues = {
  issueCategoryDeviceHealth: 'Device',
  issueCategoryReagentHealth: 'Reagent',
  issueCategoryDataHealth: 'Data',
  issueCategoryConnectivityHealth: 'Connectivity',
}
async function getDevicesReport(request, reply) {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, query, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const devices = await listDevices(request)
  const { query } = request
  const reportFile = path.join(
    __dirname,
    '../excelreports/reportTemplates/Devices.xlsx'
  )
  const report = generateReport(
    query.format,
    reportFile,
    '<Headers>', // This is an invented tag to look for in the report template. Also we can find a text for a header instead of create a place holder.
    _.map(devices.data, elem =>
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
    ),
    {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
    2 // If the function locate the row number for the placeholder,
    // how many rows after appears the placeholders for the values (default 0)
  )
  return downloadReportFile(report, reply, request.format)
}
async function downloadReportFile(
  reportFunction,
  reply,
  format,
  fileName = 'report_'
) {
  await reportFunction
    .then(resp => {
      reply(resp)
        .encoding('binary')
        .type('application/octet-stream')
        .header(
          'content-disposition',
          `attachment; filename=${fileName}_${new Date().toISOString()}.${format};`
        )
    })

    .catch(err => {
      console.error('Error ', err) // eslint-disable-line no-console
      reply(err)
    })
}
module.exports = {
  getDevicesReport,
}
