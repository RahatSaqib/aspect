const szMtbStats = {
  name: 'MTB Stats',
  description:
    'This report shows quantities and percentages of positiveness and negativeness related to MTB/Rif results',
  i18nKey: 'szMtbStats',
  externalId: 'sz_mtb_stats',
  i18nKeyDescription: 'szMtbStatsDescription',
  fileName: 'mtbStats',
  sortOrder: 11,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportSwaziland',
      functionName: 'getMtbStats',
    },
  ],
}

module.exports = {
  szMtbStats,
}
