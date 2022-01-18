const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '5Bd9cWWtxu',
  partnerName: 'Bangladesh',
  deviceApiToken: 'vqzewlc2d67v5kdwa9h6',
  serverUrl: 'https://bangladesh.aspect.id',
  partnerAbbreviation: 'BD',
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
    'assayTruenatMtb',
    'assayTruenatMtbPlus',
    'assayTruenatRif',
    'assayTruenatUnknown',
  ],
  fixtures: {
    jobFunctions,
  },
}
