const resultsDrTb10A10BCovid = {
  name: 'Report on Xpert MTB/RIF and Covid',
  description: 'DR-TB 10A-10B and Covid reporting format for the Monthly report on Xpert Results',
  i18nKey: 'reportDrTb10a10bCovid',
  externalId: 'results_10a_10b_covid', // folder name in /templates
  i18nKeyDescription: 'reportDrTb10a10bCovidDescription',
  fileName: 'ReportDrTb10a10bCovid',
  exportCsv: false,
  sortOrder: 11,
  availableForNotification: 1,
  validations: [],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportDrTb10A',
      query: {
        nameOfSharedData: 'results_10a',
      },
    },
    {
      sortOrder: 10,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportDrTb10AStool',
      query: {
        useNamedData: 'results_10a',
      },
    },
    {
      sortOrder: 20,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportDrTb10B',
      query: {
        nameOfSharedData: 'results_10a_for_nt_use',
      },
    },
    {
      sortOrder: 30,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportCovid19',
    },
    {
      sortOrder: 40,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportForNtpUse',
      query: {
        useNamedData: 'results_10a_for_nt_use',
      },
    },
  ],
}

const resultsForNTPUse = {
  name: 'For NTP Use',
  description: 'For NTP Use',
  i18nKey: 'ReportNtpUse',
  externalId: 'results_ntp_use', // folder name in /templates
  i18nKeyDescription: 'reportDescriptionNtpUse',
  fileName: 'ReportNtpUse',
  exportCsv: false,
  availableForNotification: 1,
  sortOrder: 11,
  validations: [],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportBangladesh/ntpUse',
      functionName: 'getResultsForNtpUse',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}
const resultsDrTb10A10BCovidNtpUse = {
  name: 'Report on Xpert MTB/RIF and Covid - NTP Use',
  description: 'DR-TB 10A-10B and Covid reporting format for the Monthly report on Xpert Results- NTP Use',
  i18nKey: 'reportDrTb10a10bCovidNtpUse',
  externalId: 'results_10a_10b_covid_ntp_use', // folder name in /templates
  i18nKeyDescription: 'reportDrTb10a10bCovidDescriptionNtpUse',
  fileName: 'ReportDrTb10a10bCovidNtpUse',
  exportCsv: false,
  availableForNotification: 1,
  sortOrder: 12,
  validations: [],
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getReportDrTb10a10bCovidNtpUse',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

module.exports = {
  resultsDrTb10A10BCovid,
  resultsDrTb10A10BCovidNtpUse,
  resultsForNTPUse,
}
