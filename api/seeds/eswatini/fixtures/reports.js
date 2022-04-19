const szMtbStats = {
  name: 'MTB Stats',
  description:
    'This report shows quantities and percentages of positiveness and negativeness related to MTB/Rif results',
  i18nKey: 'szMtbStats',
  externalId: 'sz_mtb_stats',
  i18nKeyDescription: 'szMtbStatsDescription',
  fileName: 'mtbStats',
  sortOrder: 100,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportEswatini',
      functionName: 'getMtbStats',
    },
  ],
}

module.exports = {
  szMtbStats,
}
