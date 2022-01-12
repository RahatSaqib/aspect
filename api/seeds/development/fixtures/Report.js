const resultsDrTb10A = {
  name: 'Monthly report on Xpert MTB/RIF',
  description:
    'DR-TB 10A reporting format for the Monthly report on Xpert MTB/RIF Results',
  i18nKey: 'Results_DR_TB_10A',
  externalId: 'results_dr_tb_10a',
  i18nKeyDescription: 'results_dr_tb_10a_description',
  fileName: 'results_dr_tb_10a',
  sortOrder: 11,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReport',
      functionName: 'getDataForReportDrTb10A',
    },
  ],
}

module.exports = {
  resultsDrTb10A,
  fixture: [resultsDrTb10A],
}
