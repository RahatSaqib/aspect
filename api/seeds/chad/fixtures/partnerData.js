const jobFunctions = require('./jobFunctions')

module.exports = {
  partner: {
    name: 'Chad',
    externalId: 'chad',
  },
  deviceApiToken: 'B2zs15mw0a01z5qzq2zo',
  partnerAbbreviation: 'TD',
  adminUserName: 'admin',
  adminPassword: 'test07',
  defaultPassword: 'test07', // default password for users that are not admins
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
  serverUrl: 'https://chad.aspect.id',
  apiUrl: 'https://chad.aspect.id/api',
  deviceConfiguration: [
    {
      deviceType: 'GeneXpert',
      data: {
        EnableAspectSync: true,
        SendResultsToAspect: true,
        AspectUploadExcludePatientId: false,
        AspectApiEndpoint: 'https://chad.aspect.id/api',
      },
    },
  ],
  deviceCapacityFactor: 3,
}
