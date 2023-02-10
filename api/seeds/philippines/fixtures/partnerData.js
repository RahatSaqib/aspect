const jobFunctions = require('./jobFunctions')

module.exports = {
  partnerName: 'Philippines',
  adminUserName: 'admin',
  adminPassword: 'e5wQ40TLzd',
  deviceApiToken: 'jdk5ctyu8jhwimkvfc99',
  partnerAbbreviation: 'PH',
  plugin: 'philippines',
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
  serverUrl: 'https://philippines.aspect.id:8443',
  apiUrl: 'https://philippines.aspect.id:8443/api',
}
