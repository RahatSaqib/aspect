const jobFunctions = require('../../fixtures/jobFunctions')

module.exports = {
  partner: {
    name: 'Nigeria',
    externalId: 'nigeria',
  },
  deviceApiToken: 'q5zh29mw0a01zkqzq1yg',
  partnerAbbreviation: 'NG',
  adminUserName: 'admin',
  adminPassword: 'test07',
  defaultPassword: 'azD45r', // default password for users that are not admins
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
  serverUrl: 'https://nigeria.aspect.id',
  apiUrl: 'https://nigeria.aspect.id/api',
  deviceConfiguration: [
    {
      deviceType: 'GeneXpert',
      data: {
        GxAlertApiEndpoint: 'https://nigeria.gxalert.com/api/',
        EnableAspectSync: true,
        SendResultsToAspect: true,
        AspectUploadExcludePatientId: false,
        AspectApiEndpoint: 'https://nigeria.aspect.id/api',
        MigrateAspectApiKey: true,
      },
    },
  ],
}
