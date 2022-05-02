const jobFunctions = require('../../fixtures/jobFunctions')

module.exports = {
  partnerName: 'Malawi',
  adminUserName: 'admin',
  adminPassword: 'yIeRINEZ',
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
  },
  partnerPlugin: '',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://malawi.aspect.id',
}
