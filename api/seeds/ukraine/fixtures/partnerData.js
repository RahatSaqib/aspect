const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  partner: {
    name: 'Ukraine',
    externalId: 'ukraine',
  },
  adminUserName: 'admin',
  adminPassword: 'test07',
  deviceApiToken: 'qqsmc85rzlaoh9aygzh2',
  lowerLevelUserPassword: '324PoCbqIeBG',
  partnerAbbreviation: 'UA',
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
  serverUrl: 'https://ukraine.aspect.id',
  apiUrl: 'https://ukraine.aspect.id/api',
  deviceCapacityFactor: 3,
  deviceConfiguration: [
    {
      deviceType: 'GeneXpert',
      data: {
        ConnectSettingsAndCustomFieldsSource: 'ASPECT',
        AspectApiEndpoint: 'https://ukraine.aspect.id/api',
        AspectAssayNameIdMappings: {
          4: 'GxMtbRif',
          7: 'GxEbola',
          8: 'GxHiv1Qual',
          9: 'GxHiv1Vl',
          10: 'GxMtbRifUltra',
          12: 'GxMtbRifUltra',
          14: 'GxHcv',
          15: 'assayGXCovid19',
          16: 'GxMtbXdr',
        },
        AspectUploadExcludePatientId: false,
        EnableAspectSync: true,
        MigrateAspectApiKey: false,
        SendResultsToAspect: true,
        EnableGxAlertSync: false,
        SendResultsToGxAlert: false,
      },
    },
  ],
}
