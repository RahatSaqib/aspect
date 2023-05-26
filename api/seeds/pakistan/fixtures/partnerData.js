const jobFunctions = require('./jobFunctions')

module.exports = {
  partnerName: 'Pakistan',
  adminUserName: 'admin',
  adminPassword: 'x2KusKKEqR8M',
  deviceApiToken: '77zc0ar862xcys2626w6',
  statsQueryDeviceApiToken: 'kcf2ve9wy96pp800kdk0',
  lowerLevelUserPassword: '324PoCbqIeBG',
  partnerAbbreviation: 'PK',
  partnerPlugin: 'pakistan',
  assayTypes: [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
    'assayGXCovid19',
  ],
  fixtures: {
    jobFunctions,
  },
  plugin: 'pakistan',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  daysLimitToNotifyResults: 30,
  serverUrl: 'https://pakistan.aspect.id',
  apiUrl: 'https://pakistan.aspect.id/api',
  excludePattern: '^ExcludeMe.+$',
  deviceCapacity: [
    {
      deviceTypeExternalId: 'CepheidGeneXpert',
      modules: [1, 2, 6, 10, 12, 14, 18, 24, 30, 36, 42, 48],
    },
  ],
}
