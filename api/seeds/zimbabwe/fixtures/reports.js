module.exports = {
  zw_device_performance: {
    name: 'Device Performance',
    description:
      'This report shows performance rates by device and assay, including: errors, activity, utilization, days offline, and average delay to upload tests. Scoped only to Cepheid GeneXpert devices.',
    i18nKey: 'devicePerformance',
    i18nKeyDescription: 'devicePerformance_description',
    externalId: 'zw_device_performance',
    fileName: 'devicePerformance',
    sortOrder: 10,
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
    sortOrder: 9,
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
