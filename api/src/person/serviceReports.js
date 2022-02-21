const { listPeople } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')

async function exportContacts(request, reply) {
  const { data } = await listPeople(request)
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return exportData(request, reply, sheetData, 'contacts', {
    replacements: getBaseReplacements(),
  })
}

module.exports = {
  exportContacts,
}
