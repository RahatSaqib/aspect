const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'hiv_admin',
  adminPassword: 'test07',
  partner: {
    name: 'Lesotho HIV',
    externalId: 'lesothoHiv',
  },
  plugin: '',
  fixtures: {
    jobFunctions,
  },
  partnerAbbreviation: 'LS',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://lesotho.aspect.id',
  apiUrl: 'https://lesotho.aspect.id/api',
  deviceCapacityFactor: 3,
}
