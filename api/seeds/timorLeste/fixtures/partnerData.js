const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '5za9c86txu',
  partner: {
    name: 'Timor Leste',
    externalId: 'timorLeste',
  },
  deviceApiToken: 'vqzewlc2d67v5kdwa9h6',
  partnerAbbreviation: 'TL',
  lowerLevelUserPassword: 'TOVpMx3nHP',
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
  serverUrl: 'https://timor.aspect.id',
  apiUrl: 'https://timor.aspect.id/api',
}
