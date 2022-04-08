module.exports = {
  m4b2Activities: {
    name: 'Module Activity Report',
    description: 'Shows devices with one or more non active modules',
    i18nKey: 'moduleActivityReport',
    i18nKeyDescription: 'moduleActivityReport_Description',
    externalId: 'module_activity_report',
    fileName: 'module_activity_report',
    exportCsv: true,
    sortOrder: 10,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportZimbabwe',
        functionName: 'getModuleActivityReport',
      },
    ],
  },
}
