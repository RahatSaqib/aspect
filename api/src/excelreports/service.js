const Excel = require('./exceljs')
const { listDevices } = require('../device/service')
const { setColumnsKeys } = require('./excelManager')

async function getDevicesReport(request) {
  // Here is a really good example of the necessity of a data layer.
  // I tried to call some existing service method for the list of devices,
  // but everyone has parameters of the API (Request, Credentials, etc).
  // I think if we don't want to repeat code we have to argue a little bit about this architecture.

  const devices = listDevices(request)
  const workbook = new Excel.Workbook()
  workbook.xlsx.readFile('../devices.xlsx').then(() => {
    const worksheet = workbook.getWorksheet(1)
    setColumnsKeys(worksheet, '<Headers>', 2)
    worksheet.addRows(devices)

    return workbook.xlsx.writeFile('new.xlsx')
  })
}

module.exports = {
  getDevicesReport,
}
