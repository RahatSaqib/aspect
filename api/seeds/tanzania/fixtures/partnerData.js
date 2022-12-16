const jobFunctions = require('../../fixtures/jobFunctions')

module.exports = {
  partnerName: 'Tanzania',
  partnerAbbreviation: 'TZ',
  adminUserName: 'admin',
  adminPassword: 'qlrQ9508*7',
  deviceApiToken: '5vqkca0d3w4p8n4k6480',
  fixtures: {
    jobFunctions,
  },
  plugin: '',
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://tanzania.aspect.id',
  apiUrl: 'https://tanzania.aspect.id/api',
}
