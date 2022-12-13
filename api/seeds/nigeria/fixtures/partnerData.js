const jobFunctions = require('./jobFunctions')

module.exports = {
  partnerName: 'Nigeria',
  deviceApiToken: 'q5zh29mw0a01zkqzq1yg',
  partnerAbbreviation: 'NG',
  adminUserName: 'admin',
  adminPassword: 'bC2B04ABra',
  defaultPassword: 'azD45r', // default password for users that are not admins
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
  serverUrl: 'https://nigeria.aspect.id',
  apiUrl: 'https://nigeria.aspect.id/api',
}
