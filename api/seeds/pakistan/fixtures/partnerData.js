const jobFunctions = require('./jobFunctions')

module.exports = {
  partnerName: 'Pakistan',
  adminUserName: 'admin',
  adminPassword: 'x2KusKKEqR8M',
  deviceApiToken: '77zc0ar862xcys2626w6',
  statsQueryDeviceApiToken: 'kcf2ve9wy96pp800kdk0',
  lowerLevelUserPassword: '324PoCbqIeBG',
  serverUrl: 'https://pakistan.aspect.id',
  partnerAbbreviation: 'PK',
  partnerPlugin: 'pakistan',
  assayTypes: [
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
