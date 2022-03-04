module.exports = {
  m4b2Activities: {
    name: 'Xpert Test Activities Report',
    description:
      'This report shows the number of GeneXpert MTB tests performed categorized by result',
    i18nKey: 'xpertTestActivitiesReport',
    i18nKeyDescription: 'xpertTestActivitiesReport_description',
    externalId: 'xpert_test_activities_report',
    fileName: 'm4b2Activities',
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
  m4b1Patients: {
    name: 'Xpert Patients Report',
    description:
      'This report shows the number of GeneXpert MTB tests performed categorized by result and patients types',
    i18nKey: 'xpertPatientsReport',
    i18nKeyDescription: 'xpertPatientsReport_description',
    externalId: 'xpert_m4b1_patients',
    fileName: 'm4b1Patients',
    sortOrder: 20,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getGeneXpertM4B1PatientsReport',
      },
    ],
  },
}
