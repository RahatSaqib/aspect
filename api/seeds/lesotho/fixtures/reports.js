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
