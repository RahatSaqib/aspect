const resultsDrTb10A10BCovid = {
  name: 'Monthly report on Xpert MTB/RIF and Covid',
  description:
    'DR-TB 10A-10B and Covid reporting format for the Monthly report on Xpert Results',
  i18nKey: 'reportDrTb10a10bCovid',
  externalId: 'results_10a_10b_covid', // folder name in /templates
  i18nKeyDescription: 'reportDrTb10a10bCovidDescription',
  fileName: 'ReportDrTb10a10bCovid',
  exportCsv: false,
  sortOrder: 11,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportDrTb10A',
    },
    {
      sortOrder: 1,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportDrTb10B',
    },
    {
      sortOrder: 2,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportCovid19',
    },
  ],
}

module.exports = {
  resultsDrTb10A10BCovid,
}
