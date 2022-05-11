const jobFunctions = require('../../fixtures/jobFunctions')

module.exports = {
  partnerName: 'DRC',
  adminUserName: 'admin',
  adminPassword: 'JP8VQ7H6uT',
  deviceApiToken: '2k8BAP8zBdS2SuxG8nsxmwsQC43PT6nF',
  lowerLevelUserPassword: 'Y29bDu28',
  partnerAbbreviation: 'CD',
  fixtures: {
    jobFunctions,
  },
  partnerPlugin: '',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://drc.aspect.id',
}
