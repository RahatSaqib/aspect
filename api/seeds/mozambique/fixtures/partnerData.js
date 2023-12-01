const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  partner: {
    name: 'Mozambique',
    externalId: 'mozambique',
  },
  deviceApiToken: 'dwumjc2a7ke5w6a1c0e0',
  partnerAbbreviation: 'MZ',
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
  serverUrl: 'https://mozambique.aspect.id:9443',
  apiUrl: 'https://mozambique.aspect.id:9443/api',
}
