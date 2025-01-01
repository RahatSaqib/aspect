const jobFunctions = require('./jobFunctions')
const webhookServers = require('../../fixtures/webhookServers')

module.exports = {
  partner: {
    name: 'Pakistan NTP',
    externalId: 'pakistanNtp',
  },
  adminUserName: 'admin',
  adminPassword: 'test07',
  deviceApiToken: '77zc0ar862xcys2626w6',
  statsQueryDeviceApiToken: 'kcf2ve9wy96pp800kdk0',
  lowerLevelUserPassword: '324PoCbqIeBG',
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
  /* Author : Mehdi Ghorbani
   * Reason : Add Lot Number to Rif , Rif Ultra & Xdr consumables
   * Ticket : HD-1471
   * */
  consumableStrategies: {
    GxMtbRifCartridge: 'withLotAndExpirationDateStrategy',
    GxMtbRifUltraCartridge: 'withLotAndExpirationDateStrategy',
    GxHiv1VlCartridge: 'withExpirationDateStrategy',
    GxHiv1QualCartridge: 'withExpirationDateStrategy',
    GxEbolaCartridge: 'withExpirationDateStrategy',
    assayGXCovid19Cartridge: 'withExpirationDateStrategy',
    GxMtbXdrCartridge: 'withLotAndExpirationDateStrategy',
    GxHCVCartridge: 'withExpirationDateStrategy',
  },
  fixtures: {
    jobFunctions,
    webhookServers,
  },
  plugin: 'pakistan',
  deviceLogHistoryDays: 365,
  autoAcknowledgeOlderThanDays: null,
  numberToLeaveUnacknowledged: null,
  maxDaysDeviceOffline: 7,
  maxDaysDeviceNoResults: 14,
  dueDaysInventoryStockout: 30,
  dueDaysInventoryStockExpiring: 30,
  daysLimitToNotifyResults: 30,
  serverUrl: 'https://pakistan.aspect.id',
  apiUrl: 'https://pakistan.aspect.id/api',
  excludePattern: '^ExcludeMe.+$',
  deviceCapacityFactor: 3,
}
