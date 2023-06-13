module.exports = {
  adminUserName: 'admin',
  adminPassword: 'test07',
  partner: {
    name: 'Partner One',
    externalId: 'partnerOne',
  },
  jobFunctionsToNotify: ['admin'],
  serverUrl: 'http://localhost:8000',
  dueDaysCalibrationIssue: 90,
  apiUrl: 'http://localhost:8080',
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
}
