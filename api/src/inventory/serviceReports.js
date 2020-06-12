const { format } = require('date-fns')
const { listInventoryItems } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')

async function exportSupplies(request, reply) {
  const { data } = await listInventoryItems(request)
  const sheetData = {
    dataRows: data.map(item => ({
      ...item,
      expires: item.canExpire,
      expiresOn: format(new Date(item.expiresOn), 'yyyy-MM-dd'),
    })),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'supplies', {
    replacements: getBaseReplacements(),
  })
}

module.exports = {
  exportSupplies,
}
