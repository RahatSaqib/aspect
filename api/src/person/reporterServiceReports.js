const { format } = require('date-fns')
const { listRefreshTokens } = require('./service')
const { exportData } = require('../shared/excel')

async function exportReporters(request, reply) {
  const { data } = await listRefreshTokens(request)
  const sheetData = {
    dataRows: data.map(item => ({
      ...item,
      // replace array of `siteIssues` with csv-string of IssueCategory shortNames
      totalOnTreatment: `${item.totalOnTreatment}/${item.requiresFollowUp}`,
      revoked: item.revoked ? 'YES' : 'NO',
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
  exportReporters,
}
