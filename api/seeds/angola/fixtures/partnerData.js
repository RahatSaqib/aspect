const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '8Zx8z8CR',
  partnerName: 'Angola',
  deviceApiToken: 'bh59kmC69TZh2EEvVUz25mwx',
  serverUrl: 'https://angola.aspect.id',
  partnerAbbreviation: 'AO',
  lowerLevelUserPassword: 'wMNrV96R',
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
  ],
  fixtures: {
    jobFunctions,
  },
}
