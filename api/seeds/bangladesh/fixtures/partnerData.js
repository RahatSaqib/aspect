const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  adminUserName: 'admin',
  adminPassword: 'test07',
  partner: {
    name: 'Bangladesh',
    externalId: 'bangladesh',
  },
  deviceApiToken: 'vqzewlc2d67v5kdwa9h6',
  partnerAbbreviation: 'BD',
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
    'assayTruenatMtb',
    'assayTruenatMtbPlus',
    'assayTruenatRif',
    'assayTruenatUnknown',
  ],
  fixtures: {
    jobFunctions,
    webhookServers,
  },
  plugin: 'bangladesh',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://bangladesh.aspect.id',
  apiUrl: 'https://bangladesh.aspect.id/api',
  excludePattern: '\\b(EQA|VN-XPERT-23-B\\d[\\w]*)\\b',
  deviceCapacityFactor: 2,
  customWorkingDays: JSON.stringify({
    excludedDays: '6', // Exclude Fridays. the function DAYOFWEEK starts from Sunday 1-7, where 1 is Sunday and 7 is Saturday
    daysPerMonth: 24,
    daysPerQuarter: 72,
    daysPerYear: 288,
  }),
}
