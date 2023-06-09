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

const xpertSiteSummaryReportSiteWise = {
  name: 'Xpert Site Summary Report - Site Wise',
  description: 'List of sites with counts of the results of different types from all devices at the site',
  i18nKey: 'xpert_site_summary_site_wise_report',
  i18nKeyDescription: 'xpert_site_summary_site_wise_report_description',
  externalId: 'pk_xpert_site_summary_site_wise_report', // folder name in /templates with low dash casing
  fileName: 'xpertSiteSummaryReportSiteWise',
  exportCsv: false,
  exportExcel: true,
  sortOrder: 0,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReportsPakistan',
      functionName: 'xpertSiteSummarySiteWiseReport',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}


const xpertWorkloadSummaryReport = {
  name: 'Xpert Workload Summary Report',
  description: 'A list of all devices in the system and aggregated by assay and by month.',
  i18nKey: 'xpert_workload_summary_report',
  i18nKeyDescription: 'xpert_workload_summary_report_description',
  externalId: 'pk_xpert_workload_summary_report', // folder name in /templates with low dash casing
  fileName: 'xpertWorkloadSummaryReport',
  exportCsv: false,
  exportExcel: true,
  sortOrder: 0,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReportsPakistan/xpertWorkloadSummaryReport',
      functionName: 'xpertWorkloadSummaryReportByDevice',
      query: {
        avoidStreaming: true,
      },
    },
    {
      sortOrder: 1,
      moduleName: 'device/serviceReportsPakistan/xpertWorkloadSummaryReport',
      functionName: 'xpertWorkloadSummaryReportByDistrict',
      query: {
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
  xpertSiteDetailedReport,
  xpertSiteSummaryReportSiteWise,
  xpertWorkloadSummaryReport,
  missingCartridgesReport,
}
