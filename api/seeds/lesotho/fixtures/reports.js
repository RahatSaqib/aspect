const DeviceShortSummaryReport = {
  name: 'Device Short Summary Report',
  description: 'Compact version of Device and Site Summary Report',
  i18nKey: 'deviceShortSummaryReport',
  externalId: 'device_short_summary_report', // folder name in /templates
  i18nKeyDescription: 'deviceShortSummaryReportDescription',
  fileName: 'DeviceShortSummaryReport',
  exportCsv: false,
  availableForNotification: 1,
  sortOrder: 5,
  validations: [],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReportsLesotho/deviceShortSummaryReport',
      functionName: 'getAllDeviceReportData',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

module.exports = {
  DeviceShortSummaryReport,
}
