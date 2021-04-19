const jobFunctions = require('./jobFunctions')

module.exports = {
  adminUserName: 'admin',
  adminPassword: '5za9c86txu',
  partnerName: 'Timor Leste',
  deviceApiToken: 'vqzewlc2d67v5kdwa9h6',
  serverUrl: 'https://timor.aspect.id',
  partnerAbbreviation: 'TL',
  lowerLevelUserPassword: 'TOVpMx3nHP',
  deviceLogHistoryDays: 365,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  fixtures: {
    jobFunctions,
  },
}
