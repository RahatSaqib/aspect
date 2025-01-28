const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  adminUserName: 'admin',
  adminPassword: 'test07',
  partner: {
    name: 'MoHS',
    externalId: 'mohs',
  },
  deviceApiToken: 'ukpjat39531egjy4pc20',
  partnerAbbreviation: 'MM',
  lowerLevelUserPassword: 'AL21Uqpo$^hT3',
  plugin: 'myanmar',
  fixtures: {
    jobFunctions,
    webhookServers,
  },
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  serverUrl: 'https://myanmar.aspect.id',
  apiUrl: 'https://myanmar.aspect.id/api',
  deviceConfiguration: [
    {
      deviceType: 'GeneXpert',
      data: {
        EnableInventoryModule: false,
        ShowPopupWindowOnNewTest: true,
        ClearLISSettingsIfTheyPointToGxAlert: false,
        HideArchivedTestsWithoutSampleIdFromTestDetails: true,
        EnableAspectSync: true,
        SendResultsToAspect: true,
        AspectUploadExcludePatientId: false,
        AspectApiEndpoint: 'https://myanmar.aspect.id/api',
        MigrateAspectApiKey: true,
        CustomFieldsEnabled: true,
        ConnectSettingsAndCustomFieldsSource: 'ASPECT',
      },
    },
  ],
  deviceCapacityFactor: 3,
}
