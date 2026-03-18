const EidMonthlyReport = {
  name: 'EID Monthly Report',
  description: 'HIV EID (Early Infant Diagnosis) tests with EID testing window.',
  i18nKey: 'eid_monthly_report',
  i18nKeyDescription: 'eid_monthly_report_description',
  externalId: 'chad_eid_monthly_report',
  fileName: 'ChadEidMonthlyReport',
  sortOrder: 25,
  availableForNotification: 1,
  exportCsv: false,
  exportExcel: true,
  validations: ['dateRangeRequired'],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReport',
      functionName: 'getAllResultsReport',
      query: {
        assayId: 'GxHiv1Qual',
        sortCol: 'endedOn',
        sortDir: 'desc',
        maxNumberOfRecords: 1000000,
      },
    },
    {
      sortOrder: 1,
      moduleName: 'result/serviceReportChad',
      functionName: 'getEidAgeGroupSummaryReport',
      query: {},
    },
  ],
}

module.exports = {
  EidMonthlyReport,
}
