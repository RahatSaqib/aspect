const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: 'test07',
  partner: {
    name: 'Lesotho',
    externalId: 'lesotho',
  },
  plugin: 'lesotho',
  fixtures: {
    jobFunctions,
  },
  partnerAbbreviation: 'LS',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://lesotho.aspect.id',
  apiUrl: 'https://lesotho.aspect.id/api',
  deviceCapacityFactor: 3,
  deviceConfiguration: [
    {
      deviceType: 'GeneXpert',
      data: {
        AspectUploadExcludePatientId: false,
        AspectApiEndpoint: 'https://lesotho.aspect.id/api',
        ConnectSettingsAndCustomFieldsSource: 'ASPECT',
        EnableAspectSync: true,
        MigrateAspectApiKey: false,
        SendResultsToAspect: true,
        EnableGxAlertSync: false,
        SendResultsToGxAlert: false,
      },
    },
  ],
}
