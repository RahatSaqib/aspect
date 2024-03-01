const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  partner: {
    name: 'Philippines',
    externalId: 'philippines',
  },
  adminUserName: 'admin',
  adminPassword: 'e5wQ40TLzd',
  deviceApiToken: 'jdk5ctyu8jhwimkvfc99',
  partnerAbbreviation: 'PH',
  plugin: 'philippines',
  fixtures: {
    jobFunctions,
    webhookServers,
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
