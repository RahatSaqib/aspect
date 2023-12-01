const jobFunctions = require('./jobFunctions')

module.exports = {
  partner: {
    name: 'Ukraine',
    externalId: 'ukraine',
  },
  adminUserName: 'admin',
  adminPassword: 'F0Rbq3WtDP',
  deviceApiToken: 'qqsmc85rzlaoh9aygzh2',
  lowerLevelUserPassword: '324PoCbqIeBG',
  partnerAbbreviation: 'UK',
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
  serverUrl: 'https://ukraine.aspect.id',
  apiUrl: 'https://ukraine.aspect.id/api',
}
