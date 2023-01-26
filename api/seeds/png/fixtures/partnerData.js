const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '#&Nps5MKj9hL',
  partnerName: 'Papua New Guinea',
  deviceApiToken: 'alznnlc7d67k1kdwa5d3',
  partnerAbbreviation: 'PG',
  lowerLevelUserPassword: 'PLE1Ueu$^htj',
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
  serverUrl: 'https://png.aspect.id',
}
