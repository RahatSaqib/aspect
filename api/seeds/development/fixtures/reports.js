const deviceSummaryReport = {
  name: 'Device Summary Report',
  description: 'A list of all devices in the system and aggregated test results per device.',
  i18nKey: 'deviceSummaryReport',
  externalId: 'device_summary_report', // folder name in /templates
  i18nKeyDescription: 'deviceSummaryReportDescription',
  fileName: 'DeviceSummaryReport',
  exportCsv: false,
  sortOrder: 11,
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

const missingCartridgesReport = {
  name: 'List of Missing Lots',
  description:
    "Tests detected for following expiration dates where inventory is not tracked at the device's location or the warehouse that serves that location.",
  i18nKey: 'missing_cartridges_report',
  i18nKeyDescription: 'missing_cartridges_report_description',
  externalId: 'pk_missing_cartridges_report', // folder name in /templates with low dash casing
  fileName: 'missingCartridgesReport',
  exportCsv: false,
  exportExcel: true,
  sortOrder: 0,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'inventory/serviceReportsPakistan',
      functionName: 'missingCartridgesReport',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

module.exports = {
  deviceSummaryReport,
  missingCartridgesReport,
}
