const szMtbStats = {
  name: 'MTB Stats',
  description:
    'This report shows quantities and percentages of positiveness and negativeness related to MTB/Rif results',
  i18nKey: 'szMtbStats',
  externalId: 'sz_mtb_stats',
  i18nKeyDescription: 'szMtbStatsDescription',
  fileName: 'mtbStats',
  availableForNotification: 1,
  sortOrder: 100,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportEswatini',
      functionName: 'getMtbStats',
    },
  ],
}

const szSmsStats = {
  name: 'SMS Stats',
  description: 'Stats about SMS notifications sent',
  i18nKey: 'szMtbStats',
  externalId: 'sz_sms_stats',
  i18nKeyDescription: 'szSmsStatsDescription',
  fileName: 'smsStats',
  availableForNotification: 1,
  sortOrder: 110,
  exportCsv: false,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportEswatini',
      functionName: 'getSmsStats',
    },
  ],
}

module.exports = {
  szMtbStats,
  szSmsStats,
}
