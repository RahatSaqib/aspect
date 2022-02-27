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
  resultCountsByHIVStatus: {
    name: 'Kết quả tính theo tình trạng HIV',
    description:
      'Số lượng kết quả lao được nhóm theo tình trạng HIV của bệnh nhân',
    i18nKey: 'resultCountsByHIVStatus',
    i18nKeyDescription: 'resultCountsByHIVStatus_description',
    externalId: 'result_counts_by_hiv_status',
    fileName: 'resultCountsByHIVStatus',
    sortOrder: 30,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getResultCountsByHIVStatus',
      },
    ],
  },
}
