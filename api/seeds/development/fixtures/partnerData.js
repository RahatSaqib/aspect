module.exports = {
  adminUserName: 'admin',
  adminPassword: 'test07',
  partner: {
    name: 'Partner One',
    externalId: 'partnerOne',
  },
  partnerAbbreviation: 'NG',
  jobFunctionsToNotify: ['admin'],
  plugin: '',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  dueDaysCalibrationIssue: 90,
  serverUrl: 'https://dev.aspect.id',
  apiUrl: 'https://dev.aspect.id/api',
  deviceConfiguration: [
    {
      deviceType: 'GeneXpert',
      data: {
        EnableInventoryModule: false,
        AspectUploadExcludePatientId: false,
        GxAlertUploadExcludePatientId: false,
      },
    },
  ],
  excludePattern: '^ExcludeMe.+$',
  clientApiDetails: [
    {
      id: 'zenysisTestAggregate',
      name: 'Zenysis test',
      token: 'v6jp1u0dt8p90nx0tnc0',
      externalId: 'ZenysisTest',
      manufacturer: 'SystemOne',
    },
  ],
}
