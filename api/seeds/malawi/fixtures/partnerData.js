const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  partner: {
    name: 'Malawi',
    externalId: 'malawi',
  },
  adminUserName: 'admin',
  adminPassword: 'test07',
  deviceApiToken: 'RMENANyMAcKSKInABeAtHIcuRSiCiTZe',
  lowerLevelUserPassword: 'Y29bDu28',
  partnerAbbreviation: 'MW',
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
    webhookServers,
  },
  plugin: 'malawi',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://malawi.aspect.id:2083',
  apiUrl: 'https://malawi.aspect.id:2083/api',
}
