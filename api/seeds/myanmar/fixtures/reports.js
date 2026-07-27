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
  parameters: [
    { name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } },
    { name: 'stateId', type: 'state' },
    { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
    { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
    { name: 'assayId', type: 'assay', multiple: true },
    { name: 'consumableId', type: 'consumable' },
  ],
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
