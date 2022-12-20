const jobFunctions = require('../../fixtures/jobFunctions')

module.exports = {
  partnerName: 'Tajikistan',
  adminUserName: 'admin',
  adminPassword: 'Gx@l3rt!Adm1111n',
  deviceApiToken: 'yepp5hrgmzt6e1hxhw03',
  lowerLevelUserPassword: 'OZ75VHP8w2je',
  partnerAbbreviation: 'TJ',
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
  serverUrl: 'https://tajikistan.aspect.id',
  apiUrl: 'https://tajikistan.aspect.id/api',
}
