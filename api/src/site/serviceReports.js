const _ = require('lodash')
const { listSites } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')
const { issueCategoryIntlToShortname } = require('../shared/dictionary')

async function exportSites(request, reply) {
  const { data } = await listSites(request)
  const issueCategories = await issueCategoryIntlToShortname()
  const sheetData = {
    dataRows: data.map(item => ({
      ...item,
      // replace array of `siteIssues` with csv-string of IssueCategory shortNames
      siteIssues: _.map(item.siteIssues, key => issueCategories[key]).join(
        ', '
      ),
    })),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return exportData(request, reply, sheetData, 'sites', {
    replacements: getBaseReplacements(),
  })
}
module.exports = {
  exportSites,
}
