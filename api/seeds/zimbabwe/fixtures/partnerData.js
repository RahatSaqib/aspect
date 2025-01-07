const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  partner: {
    name: 'Zimbabwe',
    externalId: 'zimbabwe',
  },
  partnerAbbreviation: 'ZW',
  adminUserName: 'admin',
  adminPassword: 'test07',
  fixtures: {
    jobFunctions,
    webhookServers,
  },
  plugin: '',
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://zimbabwe.aspect.id:2843',
  apiUrl: 'https://zimbabwe.aspect.id:2843/api',
  deviceCapacityFactor: 3,
}
