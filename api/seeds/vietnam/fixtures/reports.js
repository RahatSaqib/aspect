module.exports = {
  m4b2Activities: {
    name: 'Xpert Test Activities Report',
    description:
      'This report shows the number of GeneXpert MTB tests performed categorized by result',
    i18nKey: 'xpertTestActivitiesReport',
    i18nKeyDescription: 'xpertTestActivitiesReport_description',
    externalId: 'xpert_test_activities_report',
    fileName: 'm4b2Activities',
    exportCsv: false,
    sortOrder: 20,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getGeneXpertM4B2ActivitiesReport',
        query: {
          sortCol: 'triggeredOn',
          sortDir: 'asc',
          hasResults: 1,
        },
      },
    ],
  },
  listRResistantTest: {
    name: 'List-R Resistant Test Report',
    description: 'This report shows the list of resistant tests',
    i18nKey: 'listRResistantTestReport',
    i18nKeyDescription: 'listRResistantTestReport_description',
    externalId: 'list_r_resistant_test',
    fileName: 'listRResistantTest',
    exportCsv: false,
    sortOrder: 30,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getListRResistantTestReport',
      },
    ],
  },
  reasonForTestingReport: {
    name: 'Reason for Testing Report',
    description: 'This report shows the reason for testing',
    i18nKey: 'reasonForTestingReport',
    i18nKeyDescription: 'reasonForTestingReport_description',
    externalId: 'reason_for_testing_report',
    fileName: 'reasonForTestingReport',
    exportCsv: false,
    sortOrder: 40,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getReasonForTestingReport',
      },
    ],
  },
}
