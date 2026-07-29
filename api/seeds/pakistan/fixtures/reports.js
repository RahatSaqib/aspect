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
  parameters: [
    { name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } },
    { name: 'stateId', type: 'state' },
    { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
    { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
    { name: 'assayId', type: 'assay', multiple: true },
    {
      name: 'showDecommissionedDevices',
      type: 'boolean',
      i18nKey: 'includeDecommissionedDevices',
      label: 'Include Decommissioned Devices',
      default: false,
    },
  ],
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
  validations: [],
  parameters: [
    { name: 'dateRange', type: 'dateRange', required: true, default: { period: 'last30Days' } },
    { name: 'stateId', type: 'state' },
    { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
    { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
    {
      name: 'showDecommissionedDevices',
      type: 'boolean',
      i18nKey: 'includeDecommissionedDevices',
      label: 'Include Decommissioned Devices',
      default: false,
    },
  ],
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

const xpertWorkloadSummaryReport = {
  name: 'Xpert Workload Summary Report',
  description: 'A list of all devices in the system and results aggregated by assay and by month.',
  i18nKey: 'xpert_workload_summary_report',
  i18nKeyDescription: 'xpert_workload_summary_report_description',
  externalId: 'pk_xpert_workload_summary_report', // folder name in /templates with low dash casing
  fileName: 'xpertWorkloadSummaryReport',
  exportCsv: false,
  exportExcel: true,
  sortOrder: 0,
  validations: [],
  parameters: [
    { name: 'dateRange', type: 'dateRange', required: true, default: { period: 'last30Days' } },
    { name: 'stateId', type: 'state' },
    { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
    { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
    {
      name: 'showDecommissionedDevices',
      type: 'boolean',
      i18nKey: 'includeDecommissionedDevices',
      label: 'Include Decommissioned Devices',
      default: false,
    },
  ],
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

const annualUtilizationRates = {
  name: 'National and Provincial Trends in Annual Utilization Rates',
  description:
    'The National and Provincial Trends in annual utilization rates displays the percentage of utilization for the current year and the previous 5 years of data.',
  i18nKey: 'annualUtilizationRates',
  externalId: 'pk_annual_utilization_rates',
  i18nKeyDescription: 'annual_utilization_rates_description',
  fileName: 'annualUtilizationRates',
  availableForNotification: 1,
  exportCsv: false,
  exportExcel: true,
  sortOrder: 0,
  validations: [],
  // getAnnualUtilizationRates* overwrites query.minDate/maxDate with a fixed 5-year window — user dates are never applied.
  parameters: [
    { name: 'stateId', type: 'state' },
    { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
    { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
    {
      name: 'showDecommissionedDevices',
      type: 'boolean',
      i18nKey: 'includeDecommissionedDevices',
      label: 'Include Decommissioned Devices',
      default: false,
    },
  ],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/utilizationReports',
      functionName: 'getAnnualUtilizationRatesNational',
      query: {
        hasResults: 1,
      },
    },
    {
      sortOrder: 1,
      moduleName: 'device/utilizationReports',
      functionName: 'getAnnualUtilizationRatesProvincial',
      query: {
        hasResults: 1,
      },
    },
  ],
}

module.exports = {
  deviceSummaryReport,
  xpertSiteDetailedReport,
  xpertSiteSummaryReportSiteWise,
  xpertWorkloadSummaryReport,
  annualUtilizationRates,
}
