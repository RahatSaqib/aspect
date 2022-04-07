const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '2wleb6v8hi',
  partnerName: 'Eswatini',
  deviceApiToken: 'pmvrfsxjltrzfpjfkepe',
  serverUrl: 'https://eswatini.aspect.id',
  partnerAbbreviation: 'SZ',
  lowerLevelUserPassword: 'sds123ASDTOVpMx3nHP',
  deviceLogHistoryDays: 365,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
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
}
