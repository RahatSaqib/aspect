const jobFunctions = require('./jobFunctions')

module.exports = {
  partnerName: 'Myanmar',
  deviceApiToken: 'ukpjat39531egjy4pc20',
  partnerAbbreviation: 'MM',
  adminUserName: 'myanmar_admin',
  adminPassword: '8v5TMxkpzP',
  plugin: '',
  fixtures: {
    jobFunctions,
  },
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://myanmar.aspect.id',
  apiUrl: 'https://myanmar.aspect.id/api',
}
