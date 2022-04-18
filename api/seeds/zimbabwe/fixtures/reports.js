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
  ModuleActivity: {
    name: 'Module Activity Report',
    description: 'Shows devices with one or more non active modules',
    i18nKey: 'moduleActivityReport',
    i18nKeyDescription: 'moduleActivityReport_Description',
    externalId: 'module_activity_report',
    fileName: 'module_activity_report',
    exportCsv: true,
    sortOrder: 100,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'device/serviceReportsZimbabwe',
        functionName: 'getModuleActivityReport',
      },
    ],
  },
}
