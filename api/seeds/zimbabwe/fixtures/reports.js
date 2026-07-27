module.exports = {
  zw_device_performance: {
    name: 'Device Performance',
    description:
      'This report shows performance rates by device and assay, including: errors, activity, utilization, days offline, and average delay to upload tests. Scoped only to Cepheid GeneXpert devices.',
    i18nKey: 'devicePerformance',
    i18nKeyDescription: 'devicePerformance_description',
    externalId: 'zw_device_performance',
    fileName: 'devicePerformance',
    availableForNotification: 1,
    sortOrder: 10,
    validations: [],
    parameters: [
      { name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } },
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
        moduleName: 'device/serviceReportsZimbabwe',
        functionName: 'getDevicePerformanceReport',
      },
      {
        sortOrder: 1,
        moduleName: 'device/serviceReportsZimbabwe',
        functionName: 'getDevicePerformanceReportByAssay',
      },
    ],
  },
  genexpert_issues: {
    name: 'GeneXpert Issues',
    description: 'This report shows all issues that apply to GeneXpert devices',
    i18nKey: 'geneXpertIssues',
    i18nKeyDescription: 'geneXpertIssues_description',
    externalId: 'genexpert_issues',
    fileName: 'geneXpertIssues',
    availableForNotification: 1,
    sortOrder: 9,
    validations: [],
    // Authoritative parameters for genexpert_issues (common's copy is omitted at upsert time).
    parameters: [
      { name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } },
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
        moduleName: 'device/serviceReports',
        functionName: 'getGeneXpertIssuesReport',
        query: {
          sortCol: 'triggeredOn',
          sortDir: 'asc',
          hasResults: 1,
        },
      },
    ],
  },
}
