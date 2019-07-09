const Excel = require('exceljs')
const _ = require('lodash')
const path = require('path')
const { listDevices } = require('../device/service')
const { setColumnsKeys } = require('./excelManager')

async function getDevicesReport() {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.
  const request = { query: {}, auth: { credentials: { name: 'admin' } } }
  const devices = await listDevices(request)
  const reportFile = path.join(__dirname, './reportTemplates/Devices.xlsx')
  const workbook = new Excel.Workbook()
  workbook.xlsx.readFile(reportFile).then(() => {
    const worksheet = workbook.getWorksheet(1)
    setColumnsKeys(worksheet, '<Headers>', 2)
    worksheet.addRows(devices.data)

    return workbook.xlsx.writeFile(
      path.join(__dirname, './reportTemplates/newDevices.xlsx')
    )
  })
}

module.exports = {
  getDevicesReport,
}
