const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  adminUserName: 'admin',
  adminPassword: 'test07',
  partner: {
    name: 'Papua New Guinea',
    externalId: 'papuaNewGuinea',
  },
  deviceApiToken: 'alznnlc7d67k1kdwa5d3',
  partnerAbbreviation: 'PG',
  lowerLevelUserPassword: 'PLE1Ueu$^htj',
  fixtures: {
    jobFunctions,
    webhookServers,
  },
  plugin: '',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://png.aspect.id',
  deviceCapacityFactor: 3,
}
