const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '2wleb6v8hi',
  partner: {
    name: 'Eswatini',
    externalId: 'eswatini',
  },
  deviceApiToken: 'pmvrfsxjltrzfpjfkepe',
  partnerAbbreviation: 'SZ',
  lowerLevelUserPassword: 'sds123ASDTOVpMx3nHP',
  assays: [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
    'assayGXCovid19',
    'GxMtbXdr',
  ],
  fixtures: {
    jobFunctions,
  },
  plugin: '',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://eswatini.aspect.id',
  apiUrl: 'https://eswatini.aspect.id/api',
}
