/**
 * Error rates report
 */
const errorRatesReport = {
  name: 'Error Rate',
  description: 'Report error rates per quarter, break them down by devices, modules and users',
  i18nKey: 'error_rate',
  i18nKeyDescription: 'error_rate_description',
  externalId: 'error_rate',
  fileName: 'ErrorRate',
  sortOrder: 170,
  availableForNotification: 1,
  exportCsv: false,
  exportExcel: true,
  validations: [],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getErrorRateByDeviceReport',
      query: {
        streamCSV: true,
      },
    },
    {
      sortOrder: 1,
      moduleName: 'device/serviceReports',
      functionName: 'getErrorRateByModuleReport',
      query: {
        streamCSV: true,
      },
    },
  ],
}

const quarterlyReport = {
  name: 'Quarterly Report',
  description: 'Overview of results in different categories by month/quarter/year',
  i18nKey: 'quarterlyReport',
  externalId: 'quarterly_report', // folder name in /templates
  i18nKeyDescription: 'quarterlyReportDescription',
  fileName: 'QuarterlyReport',
  exportCsv: false,
  sortOrder: 1,
  availableForNotification: 1,
  validations: [],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportMyanmar',
      functionName: 'getDataForQuarterlyReport',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

module.exports = {
  errorRatesReport,
  quarterlyReport,
}
