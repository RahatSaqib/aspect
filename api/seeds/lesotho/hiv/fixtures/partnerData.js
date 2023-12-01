const jobFunctions = require('../../shared/fixtures/jobFunctions')

module.exports = {
  adminUserName: 'hiv_admin',
  adminPassword: 'dh8sEakm6y',
  partner: {
    name: 'Lesotho HIV',
    externalId: 'lesothoHiv',
  },
  gxAlertDeviceApiKey: 'bnhqb0a2jkfajhut2x3g',
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
  serverUrl: 'https://lesotho.aspect.id',
  apiUrl: 'https://lesotho.aspect.id/api',
}
