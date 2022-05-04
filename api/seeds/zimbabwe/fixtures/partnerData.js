const jobFunctions = require('./jobFunctions')

module.exports = {
  partnerName: 'Zimbabwe',
  adminUserName: 'admin',
  adminPassword: '54wzDZPtOs',
  fixtures: {
    jobFunctions,
  },
  plugin: '',
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://zimbabwe.aspect.id:2843',
}
