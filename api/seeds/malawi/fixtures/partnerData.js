const jobFunctions = require('../../fixtures/jobFunctions')

module.exports = {
  partnerName: 'Malawi',
  adminUserName: 'admin',
  adminPassword: 'yIeRINEZ',
  deviceApiToken: 'RMENANyMAcKSKInABeAtHIcuRSiCiTZe',
  lowerLevelUserPassword: 'Y29bDu28',
  serverUrl: 'https://malawi.aspect.id',
  partnerAbbreviation: 'MW',
  assays: [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
    'assayGXCovid19',
  ],
  fixtures: {
    jobFunctions,
  },
}
