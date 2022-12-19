const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  partnerName: 'Ethiopia EPHI',
  deviceApiToken: '1tfw5604jfn09gx7upd0',

  partnerAbbreviation: 'ET',
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
  serverUrl: 'https://ethiopia.aspect.id:8093',
  partnerUrl: 'https://ethiopia.aspect.id:8093/api',
}
