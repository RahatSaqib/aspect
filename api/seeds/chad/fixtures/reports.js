const eidWindowReport = {
  name: 'HIV Results with EID testing window',
  description: 'HIV-1 Qual EID (Early Infant Diagnosis) aggregated by testing window — Includes results.',
  i18nKey: 'eid_testing_window',
  i18nKeyDescription: 'eid_testing_window_description',
  externalId: 'eid_testing_window',
  fileName: 'EID_Results_and_testing_window',
  sortOrder: 25,
  availableForNotification: 1,
  exportCsv: false,
  exportExcel: true,
  validations: ['dateRangeRequired'],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportChad',
      functionName: 'getEidTestingWindowSummaryReport',
      query: {},
    },
    {
      sortOrder: 1,
      moduleName: 'result/serviceReport',
      functionName: 'getAllResultsReport',
      query: {
        assayId: 'GxHiv1Qual',
        sortCol: 'endedOn',
        sortDir: 'desc',
        maxNumberOfRecords: 100000,
      },
    },
  ],
}

module.exports = {
  eidWindowReport,
}
