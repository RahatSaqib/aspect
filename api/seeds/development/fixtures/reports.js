const { xpertSiteSummaryReportSiteWise } = require('../../fixtures/Report')

const deviceSummaryReport = {
  name: 'Device Summary Report',
  description: 'A list of all devices in the system and aggregated test results per device.',
  i18nKey: 'deviceSummaryReport',
  externalId: 'device_summary_report', // folder name in /templates
  i18nKeyDescription: 'deviceSummaryReportDescription',
  fileName: 'DeviceSummaryReport',
  exportCsv: false,
  sortOrder: 15,
  validations: [],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getAllDeviceReport',
      query: {
        hasResults: 1,
        sortCol: 'name',
        sortDir: 'asc',
        avoidStreaming: true,
      },
    },
  ],
}

module.exports = {
  deviceSummaryReport,
  xpertSiteSummaryReportSiteWise,
}
