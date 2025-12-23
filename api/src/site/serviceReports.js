const { format } = require('date-fns')
const { listSites } = require('./listSites')
const { exportData, getBaseReplacements } = require('../shared/excel')
const { listSitesWithReporters } = require('./service')

async function exportSites(request, reply) {
  const { data } = await listSites(request)
  // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
  const sheetData = { data, defaultNoDataMessage: 'No data' }

  return exportData(request, reply, sheetData, 'sites', { replacements: getBaseReplacements() })
}

async function exportReporters(request, reply) {
  const { data } = await listSitesWithReporters(request)
  // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
  const sheetData = { data, defaultNoDataMessage: 'No data' }

  const replacements = [{ placeholder: '<date>', value: format(new Date(), 'yyyy-MM-dd') }]

  return exportData(request, reply, sheetData, 'reporters', { replacements })
}

module.exports = {
  exportSites,
  exportReporters,
}
