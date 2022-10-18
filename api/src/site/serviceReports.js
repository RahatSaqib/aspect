const _ = require('lodash')
const { format } = require('date-fns')
const { listSites } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')
const { issueCategoryIntlToShortname } = require('../shared/dictionary')
const { listSitesWithReporters } = require('./service')

async function exportSites(request, reply) {
  const { data } = await listSites(request)
  const issueCategories = await issueCategoryIntlToShortname()
  const sheetData = {
    data: data.map(item => ({
      ...item,
      // replace array of `siteIssues` with csv-string of IssueCategory shortNames
      siteIssues: _.map(item.siteIssues, key => issueCategories[key]).join(', '),
    })),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return exportData(request, reply, sheetData, 'sites', {
    replacements: getBaseReplacements(),
  })
}

async function exportReporters(request, reply) {
  const { data } = await listSitesWithReporters(request)
  const sheetData = {
    data: data.map(item => ({
      ...item,
    })),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  const replacements = [
    {
      placeholder: '<date>',
      value: format(new Date(), 'yyyy-MM-dd'),
    },
  ]
  return exportData(request, reply, sheetData, 'reporters', { replacements })
}

module.exports = {
  exportSites,
  exportReporters,
}
