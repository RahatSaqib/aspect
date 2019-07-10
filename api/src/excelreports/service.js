const Excel = require('exceljs')
const _ = require('lodash')
const path = require('path')
const { listDevices } = require('../device/service')
const { setColumnsKeysAndBindData } = require('./excelManager')

async function getDevicesReport(request) {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.
  // const request = { query: {}, auth: { credentials: { name: 'admin' } } }
  const devices = await listDevices(request)
  const reportFile = path.join(__dirname, './reportTemplates/Devices.xlsx')
  let workbook = new Excel.Workbook()
  workbook = await workbook.xlsx.readFile(reportFile)
  const worksheet = workbook.getWorksheet(1)
  setColumnsKeysAndBindData(
    worksheet,
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
  if (request.format === 'xlsx')
    await workbook.xlsx.writeFile(
      path.join(__dirname, './reportTemplates/newDevices.xlsx')
    )
  else
    await workbook.csv.writeFile(
      path.join(__dirname, './reportTemplates/newDevices.csv')
    )
}

module.exports = {
  getDevicesReport,
}
