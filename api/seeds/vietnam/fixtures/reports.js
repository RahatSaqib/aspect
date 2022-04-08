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
  m4b1Patients: {
    name: 'Xpert Patients Report',
    description:
      'This report shows the number of GeneXpert MTB tests performed categorized by result and patients types',
    i18nKey: 'xpertPatientsReport',
    i18nKeyDescription: 'xpertPatientsReport_description',
    externalId: 'xpert_m4b1_patients',
    fileName: 'm4b1Patients',
    sortOrder: 20,
    exportCsv: false,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getGeneXpertM4B1PatientsReport',
      },
    ],
  },
  resultCountsByHIVStatus: {
    // requested title: 'Kết quả tính theo tình trạng HIV',
    name: 'Result Counts by HIV status',
    // requested description: 'Số lượng kết quả lao được nhóm theo tình trạng HIV của bệnh nhân',
    description: 'Number of TB results grouped by patients HIV status',
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
  globalFundInventoryReport: {
    name: 'Global Fund Inventory Report',
    description: 'This report shows the Global Fund Inventory',
    i18nKey: 'globalFundInventoryReport',
    i18nKeyDescription: 'globalFundInventoryReport_description',
    externalId: 'global_fund_inventory_report',
    fileName: 'globalFundInventoryReport',
    exportCsv: true,
    sortOrder: 50,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getGlobalFundInventoryReport',
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
  GeneXpertM4B3BiologicalProducts: {
    name: 'M4B3 Biological Products',
    description: 'Use of Xpert Biological Products',
    i18nKey: 'xpertM4b3BiologicalProducts',
    i18nKeyDescription: 'xpertM4b3BiologicalProducts_description',
    externalId: 'xpert_m4b3_biological_products',
    fileName: 'xpert_m4b3_biological_products',
    exportCsv: false,
    sortOrder: 70,
    sheets: [
      {
        sortOrder: 0,
        moduleName: 'result/serviceReportVietnam',
        functionName: 'getGeneXpertM4B3BiologicalProducts',
      },
    ],
  },
}
