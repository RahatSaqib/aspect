const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

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
    webhookServers,
  },
  plugin: '',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://mozambique.aspect.id',
  apiUrl: 'https://mozambique.aspect.id/api',
  clientApiDetails: [
    {
      id: 'zenysisTestAggregate',
      name: 'Zenysis',
      token: 'w3wgnd8fnm67mcpfey30',
      externalId: 'Zenysis',
      manufacturer: 'SystemOne',
    },
  ],
}
