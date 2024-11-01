const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'tb_admin',
  adminPassword: 'test07',
  partner: {
    name: 'Lesotho TB',
    externalId: 'lesothoTb',
  },
  gxAlertDeviceApiKey: 'auv294emdbaervaeqzxc',
  plugin: '',
  fixtures: {
    jobFunctions,
  },
  partnerAbbreviation: 'LS',
  lowerLevelUserPassword: 'AL21Uqpo$^hT3',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://lesotho.aspect.id',
  apiUrl: 'https://lesotho.aspect.id/api',
}
