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

const xpertSiteDetailedReport = {
  name: 'Xpert Site Detailed Report',
  description: 'Xpert Implementation Site (XIS) Performance Report.',
  i18nKey: 'xpert_site_detailed_report',
  i18nKeyDescription: 'xpert_site_detailed_report_description',
  externalId: 'pk_xpert_site_detailed_report', // folder name in /templates with low dash casing
  fileName: 'xpertSiteDetailedReport',
  exportCsv: false,
  exportExcel: true,
  sortOrder: 0,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReportsPakistan',
      functionName: 'xpertSiteDetailedReport',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

module.exports = {
  deviceSummaryReport,
  xpertSiteDetailedReport,
}
