const { exportData, getBaseReplacements } = require('../shared/excel')
const listWorkload = require('./listWorkload')

async function exportWorkload(request, reply) {
  const { data, extraColumns } = await listWorkload(request)

  //
  const sheetData = {
    data,
    dynamicColumns: extraColumns.map(elem => ({
      header: elem.label,
      key: elem.fieldId,
      width: 20,
    })),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'workload', {
    replacements: getBaseReplacements(),
  })
}

module.exports = exportWorkload
