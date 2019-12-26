const path = require('path')
const { format } = require('date-fns')
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
    reports.data,
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
