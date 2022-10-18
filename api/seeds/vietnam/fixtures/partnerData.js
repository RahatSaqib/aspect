const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: 'v4zk75io79',
  partnerName: 'Vietnam',
  deviceApiToken: 'q9weva3thrtdeb8ukat4',
  partnerAbbreviation: 'VN',
  lowerLevelUserPassword: '4r5uov8rt3',
  deviceLogHistoryDays: 365,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  fixtures: {
    jobFunctions,
  },
  plugin: '',
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://vietnam.aspect.id',
}
