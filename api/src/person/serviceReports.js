const { format } = require('date-fns')
const { listPeople } = require('./service')
const { exportData } = require('../shared/excel')

async function exportContacts(request, reply) {
  const { data } = await listPeople(request)
  const sheetData = {
    dataRows: data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  const replacements = [
    {
      placeholder: '<date>',
      value: format(new Date(), 'yyyy-MM-dd'),
    },
  ]
  return exportData(request, reply, sheetData, 'contacts', { replacements })
}
module.exports = {
  exportContacts,
}
