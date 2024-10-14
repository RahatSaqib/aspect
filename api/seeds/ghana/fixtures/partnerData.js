const jobFunctions = require('../../fixtures/jobFunctions')

module.exports = {
  partner: {
    name: 'Ghana',
    externalId: 'ghana',
  },
  partnerAbbreviation: 'GH',
  adminUserName: 'admin',
  adminPassword: 'test07',
  deviceApiToken: '0ziykx2taf8kdmvqk304',
  fixtures: {
    jobFunctions,
  },
  plugin: '',
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://ghana.aspect.id',
  apiUrl: 'https://ghana.aspect.id/api',
  deviceConfiguration: [
    {
      deviceType: 'GeneXpert',
      data: {
        GxAlertApiEndpoint: 'https://ghana.gxalert.com/api/',
        EnableAspectSync: true,
        SendResultsToAspect: true,
        AspectUploadExcludePatientId: false,
        AspectApiEndpoint: 'https://ghana.aspect.id/api',
        MigrateAspectApiKey: true,
      },
    },
  ],
}
