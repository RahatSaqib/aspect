const resultsDrTb10A = {
  name: 'Monthly report on Xpert MTB/RIF',
  description:
    'DR-TB 10A reporting format for the Monthly report on Xpert MTB/RIF Results',
  i18nKey: 'reportDrTb10a',
  externalId: 'report_dr_tb_10a', // folder name in /templates
  i18nKeyDescription: 'reportDrTb10aDescription',
  fileName: 'ReportDrTb10a',
  sortOrder: 11,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportBangladesh',
      functionName: 'getDataForReportDrTb10A',
    },
  ],
}

module.exports = {
  resultsDrTb10A,
}
