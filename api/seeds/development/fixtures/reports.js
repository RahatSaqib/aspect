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

module.exports = {
  deviceSummaryReport,
  xpertSiteSummaryReportSiteWise,
}
