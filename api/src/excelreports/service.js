const _ = require('lodash')
const path = require('path')
const { listDevices } = require('../device/service')
const { generateReport } = require('./excelManager')

async function getDevicesReport(request, reply) {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.
  // const request = { query: {}, auth: { credentials: { name: 'admin' } } }
  const devices = await listDevices(request)
  const reportFile = path.join(__dirname, './reportTemplates/Devices.xlsx')
  const fileStream = generateReport(
    request.format,
    reportFile,
    '<Headers>',
    _.map(devices.data, elem =>
      Object.assign(
        {
          testTotal: elem.availability.total,
          rate: elem.availability.total * 100,
          issueCategories: elem.issueCategories.join(','),
        },
        elem
      )
    ),
    2
  )
  return reply(fileStream)
    .header(
      'Content-Disposition',
      `attachment; filename=devices.${request.format}`
    )
    .header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
}

module.exports = {
  getDevicesReport,
}
