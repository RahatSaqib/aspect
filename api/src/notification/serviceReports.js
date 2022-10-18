const _ = require('lodash')
const listNotifications = require('./listNotifications')
const { exportData, getBaseReplacements } = require('../shared/excel')
const { issueCategoryIntlToShortname } = require('../shared/dictionary')

async function exportNotifications(request, reply) {
  const { data } = await listNotifications(request)
  const issueCategories = await issueCategoryIntlToShortname()
  const sheetData = {
    data: data.map(item => ({
      ...item,
      // TODO: update func listNotifications() to include column issueCategories
      // replace array of `issueCategories` with csv-string of IssueCategory shortNames
      issuesCategories: _.map(item.issueCategories, key => issueCategories[key]).join(', '),
    })),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'notifications', {
    replacements: getBaseReplacements(),
  })
}

module.exports = {
  exportNotifications,
}
