const { knex, sortPageParams, filterDateRangeParams } = require('../../db')
const { getFactResultCountBase, FACT_FIELD_SCOPE } = require('../../result/common/db')
const { allResultCategoryToId } = require('../../shared/dictionary')
const { getBaseQuery: getResultBaseQuery } = require('../../result/query')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')
const { getBasicsForDevicesReport } = require('../common/db')

async function getDevicesWithCountsForTB(dataConstraints, query, timezoneIANA) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)

  const resultCategoryIds = await allResultCategoryToId()
  const factResultCount = getFactResultCountBase({
    resultCategoryIds,
    dataConstraints,
    query,
    fieldsScope: [FACT_FIELD_SCOPE.all],
    timeFrame: 'day',
    assay: ['GxMtbRif', 'GxMtbRifUltra', 'GxMtbXdr'],
  })
    .select('d.id AS deviceId')
    .groupBy('d.id')

  const resultsCount = getResultBaseQuery(knex, dataConstraints)
    .select({
      deviceId: 'r.deviceId',
      totalXpertModulesInUse: knex.raw('count(DISTINCT moduleName)'),
      lastResultUploadedOn: knex.raw('MAX(r.updatedOn)'),
      lastResultConductedOn: knex.raw('MAX(r.endedOn)'),
    })
    .groupBy('r.deviceId')
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra', 'GxMtbXdr'])
    .modify(filterDateRangeParams, query, 'r.endedOn')

  const deviceInactiveDays = knex
    .from('DeviceMaintenanceStatusLog as dmsl')
    .select(['deviceId', knex.raw('COUNT(DISTINCT day) as totalInactiveDays')])
    .join('DeviceMaintenanceStatus as dms', 'dms.id', 'dmsl.deviceMaintenanceStatusId')
    .modify(filterDateRangeParams, query, 'day')
    .whereRaw('DAYOFWEEK(day) not in (1,7)')
    .where('active', 0)
    .groupBy(['deviceId', 'active'])

  return deviceQuery
    .clone()
    .leftJoin(resultsCount.as('resultsCount'), function () {
      this.on('resultsCount.deviceId', 'd.id')
    })
    .leftJoin(factResultCount.as('factResultCount'), 'factResultCount.deviceId', 'd.id')
    .leftJoin(deviceInactiveDays.as('deviceInactiveDays'), function () {
      this.on('deviceInactiveDays.deviceId', 'd.id')
    })
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .groupBy('d.id')
    .modify(sortPageParams, query, 'name')
    .select([
      'd.name',
      's.name AS siteName',
      'st.name AS stateName',
      'lg.name AS districtName',
      'd.serial AS serial',
      'd.lastInstrumentSerial AS lastInstrumentSerial',
      'dms.name AS maintenanceStatusName',
      knex.raw("dmsl.data->>'$.options.data.notes' AS maintenanceStatusNotes"),
      getDateTimeProjectionInTimeZoneIANA(knex, 'd.lastPingOn', timezoneIANA, 'lastPingOn'),
      'd.lastPingFromIp AS lastPingFromIp',
      getDateTimeProjectionInTimeZoneIANA(
        knex,
        'COALESCE(configurationData->>"$.systemTime.localTime", configurationData->>"$.systemTime")',
        timezoneIANA,
        'informationDate'
      ),
      knex.raw('d.ConfigurationData ->> "$.computerOsVersion" AS computerOsVersion'),
      'd.timezone AS timezone',
      knex.raw('d.ConfigurationData ->> "$.culture" AS language'),
      knex.raw('d.ConfigurationData ->> "$.gxConnectVersion" AS connectorVersion'),
      knex.raw('d.ConfigurationData ->> "$.databaseDeviceOk" AS deviceFound'),
      knex.raw('d.ConfigurationData ->> "$.lisConfigOk" AS lisConfiguredCorrectly'),
      // The deviceApi doesn't populate d.putInService well, so we are going to get it from configurationData until we fix that
      getDateTimeProjectionInTimeZoneIANA(
        knex,
        'COALESCE(d.putInService, d.configurationData->>"$.putInService")',
        timezoneIANA,
        'instalationDate'
      ),
      knex.raw('d.ConfigurationData ->> "$.routerNumber" AS routerNumber'),
      knex.raw('d.ConfigurationData ->> "$.sim1SerialNumber" AS sim1SerialNumber'),
      knex.raw('d.ConfigurationData ->> "$.sim2SerialNumber" AS sim2SerialNumber'),
      knex.raw('IFNULL(resultsCount.totalXpertModulesInUse, 0) AS totalXpertModulesInUse'),
      knex.raw('IFNULL(factResultCount.cnt_inh, 0) AS INH'),
      knex.raw('IFNULL(factResultCount.cnt_flq, 0) AS FLQ'),
      knex.raw('IFNULL(factResultCount.cnt_amk, 0) AS AMK'),
      knex.raw('IFNULL(factResultCount.cnt_kan, 0) AS KAN'),
      knex.raw('IFNULL(factResultCount.cnt_cap, 0) AS CAP'),
      knex.raw('IFNULL(factResultCount.cnt_eth, 0) AS ETH'),
      knex.raw('IFNULL(deviceInactiveDays.totalInactiveDays, 0) AS totalInterruptedDays'),
      knex.raw('IFNULL(factResultCount.cnt_NotDetected, 0) AS totalMtbNegative'),
      knex.raw('IFNULL(factResultCount.cnt_Detected, 0) AS totalMtbDetected'),
      knex.raw('IFNULL(factResultCount.cnt_TraceDetected, 0) AS totalMtbTraceDetected'),
      knex.raw('IFNULL(factResultCount.cnt_mtbDetectedRifNotDetected, 0) AS totalMtbSens'),
      knex.raw('IFNULL(factResultCount.cnt_mtbDetectedRifDetected, 0) AS totalMtbRes'),
      knex.raw('IFNULL(factResultCount.cnt_mtbDetectedRifIndeterminate, 0) AS totalMtbIndeterminate'),
      knex.raw('IFNULL(factResultCount.cnt_Error, 0) AS totalErrors'),
      knex.raw('IFNULL(factResultCount.cnt_NoResult, 0) AS mtbNoResult'),
      knex.raw('IFNULL(factResultCount.cnt_Invalid, 0) AS mtbInvalid'),
      knex.raw('IFNULL(factResultCount.cntAll, 0) AS totalXpertResults'),
      getDateTimeProjectionInTimeZoneIANA(knex, 'd.lastPingOn', timezoneIANA, 'lastPingOn'),
      getDateTimeProjectionInTimeZoneIANA(
        knex,
        'resultsCount.lastResultUploadedOn',
        timezoneIANA,
        'lastResultUploadedOn'
      ),
      getDateTimeProjectionInTimeZoneIANA(
        knex,
        'resultsCount.lastResultConductedOn',
        timezoneIANA,
        'lastResultConductedOn'
      ),
    ])
}

module.exports = {
  getDevicesWithCountsForTB,
}
