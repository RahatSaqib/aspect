const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '2wleb6v8hi',
  partnerName: 'Swaziland',
  deviceApiToken: 'pmvrfsxjltrzfpjfkepe',
  serverUrl: 'https://swaziland.aspect.id',
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
