module.exports = {
  adminName: 'admin',
  adminPassword: 'test07',
  partnerName: 'Partner One',
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
}
