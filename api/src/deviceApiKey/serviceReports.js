const { listDeviceApiKeys } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')

async function exportDeviceApiKeys(request, reply) {
  const { data } = await listDeviceApiKeys(request)
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'deviceApiKeys', {
    replacements: getBaseReplacements(),
  })
}
module.exports = {
  exportDeviceApiKeys,
}
