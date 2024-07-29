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

module.exports = {
  errorRatesReport,
}
