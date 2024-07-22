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
  quarterlyReport,
}
