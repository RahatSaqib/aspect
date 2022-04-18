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

const szSmsStats2 = {
  name: 'MTB Stats',
  description: 'Stats about SMS notifications sent',
  i18nKey: 'szMtbStats',
  externalId: 'sz_sms_stats',
  i18nKeyDescription: 'szSmsStatsDescription',
  fileName: 'smsStats',
  sortOrder: 110,
  sheets: [
    {
      sortOrder: 10,
      moduleName: 'result/serviceReportEswatini',
      functionName: 'getSmsStats',
    },
  ],
}

module.exports = {
  szMtbStats,
  szSmsStats2,
}
