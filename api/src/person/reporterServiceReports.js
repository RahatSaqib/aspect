const path = require('path')
const { format } = require('date-fns')
const _ = require('lodash')
const { listRefreshTokens } = require('./service')
const {
  generateReport,
  downloadReportFile,
} = require('../excelreports/excelManager')

async function getReport(request, reply) {
  const reports = await listRefreshTokens(request)
  const { query } = request
  const reportFile = path.join(
    __dirname,
    '../excelreports/reportTemplates/Reporters.xlsx'
  )
  const report = generateReport(
    query.format,
    reportFile,
    '<Headers>',
    _.map(reports.data, elem =>
      Object.assign(elem, {
        acknowledgedRatio: _.round(elem.acknowledgedRatio * 100),
        confirmFollowUpRatio: _.round(elem.confirmFollowUpRatio * 100),
      })
    ),
    {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
    2
  )
  return downloadReportFile(report, reply, request.format)
}
module.exports = {
  getReport,
}
