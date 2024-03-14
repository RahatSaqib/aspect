const { knex, sortPageParams, filterDateRangeParams } = require('../../db')
const {
  getBaseQuery: getResultBaseQuery,
  modifiers,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
} = require('../../result/query')
const { XDR_RESISTANCES } = require('../../shared/constants')
const { getDateTimeProjectionInUserTimeZone } = require('../../shared/date')
const { getBasicsForDevicesReport } = require('../common/db')

const xdrExtraColumns = Object.fromEntries(
  XDR_RESISTANCES.map(resistance => [
    resistance,
    knex.raw(`SUM(
    CASE WHEN
      JSON_SEARCH(
        r.resultData ->> '$.detectedResistance[*]',
        'one',
        '${resistance}'
      ) IS NOT NULL
    THEN 1 ELSE 0 END)`),
  ])
)

async function getDevicesWithCountsForTB(dataConstraints, query, timezone) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)
  const {
    mtbDetectedRifNotDetected,
    mtbDetectedRifDetected,
    mtbNotDetected,
    mtbInvalid,
    mtbError,
    mtbNoResult,
    mtbDetectedRifIndeterminate,
    mtbDetected,
    mtbTraceDetected,
  } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

  const resultsCount = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
    .select({
      ...xdrExtraColumns,
      deviceId: 'deviceId',
      mtbNotDetected,
      mtbDetectedRifNotDetected,
      mtbDetectedRifDetected,
      mtbDetectedRifIndeterminate,
      mtbError,
      mtbNoResult,
      mtbInvalid,
      mtbDetected,
      mtbTraceDetected,
      totalXpertTests: knex.raw('count(*)'),
      totalXpertModulesInUse: knex.raw('count(DISTINCT moduleName)'),
      lastResultUploadedOn: knex.raw('MAX(r.createdOn)'),
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
      getDateTimeProjectionInUserTimeZone(knex, 'd.lastPingOn', timezone, 'lastPingOn'),
      'd.lastPingFromIp AS lastPingFromIp',
      getDateTimeProjectionInUserTimeZone(
        knex,
        'COALESCE(configurationData->>"$.systemTime.localTime", configurationData->>"$.systemTime")',
        timezone,
        'informationDate'
      ),
      knex.raw('d.ConfigurationData ->> "$.computerOsVersion" AS computerOsVersion'),
      'd.timezone AS timezone',
      knex.raw('d.ConfigurationData ->> "$.culture" AS language'),
      knex.raw('d.ConfigurationData ->> "$.gxConnectVersion" AS connectorVersion'),
      knex.raw('d.ConfigurationData ->> "$.databaseDeviceOk" AS deviceFound'),
      knex.raw('d.ConfigurationData ->> "$.lisConfigOk" AS lisConfiguredCorrectly'),
      // The deviceApi doesn't populate d.putInService well, so we are going to get it from configurationData until we fix that
      getDateTimeProjectionInUserTimeZone(
        knex,
        'COALESCE(d.putInService, d.configurationData->>"$.putInService")',
        timezone,
        'instalationDate'
      ),
      knex.raw('d.ConfigurationData ->> "$.routerNumber" AS routerNumber'),
      knex.raw('d.ConfigurationData ->> "$.sim1SerialNumber" AS sim1SerialNumber'),
      knex.raw('d.ConfigurationData ->> "$.sim2SerialNumber" AS sim2SerialNumber'),
      knex.raw('IFNULL(resultsCount.totalXpertModulesInUse, 0) AS totalXpertModulesInUse'),
      knex.raw('IFNULL(resultsCount.INH, 0) AS INH'),
      knex.raw('IFNULL(resultsCount.FLQ, 0) AS FLQ'),
      knex.raw('IFNULL(resultsCount.AMK, 0) AS AMK'),
      knex.raw('IFNULL(resultsCount.KAN, 0) AS KAN'),
      knex.raw('IFNULL(resultsCount.CAP, 0) AS CAP'),
      knex.raw('IFNULL(resultsCount.ETH, 0) AS ETH'),
      knex.raw('IFNULL(deviceInactiveDays.totalInactiveDays, 0) AS totalInterruptedDays'),
      knex.raw('IFNULL(resultsCount.mtbNotDetected, 0) AS totalMtbNegative'),
      knex.raw('IFNULL(resultsCount.mtbDetected, 0) AS totalMtbDetected'),
      knex.raw('IFNULL(resultsCount.mtbTraceDetected, 0) AS totalMtbTraceDetected'),
      knex.raw('IFNULL(resultsCount.mtbDetectedRifNotDetected, 0) AS totalMtbSens'),
      knex.raw('IFNULL(resultsCount.mtbDetectedRifDetected, 0) AS totalMtbRes'),
      knex.raw('IFNULL(resultsCount.mtbDetectedRifIndeterminate, 0) AS totalMtbIndeterminate'),
      knex.raw('IFNULL(resultsCount.mtbError, 0) AS totalErrors'),
      knex.raw('IFNULL(resultsCount.mtbNoResult, 0) AS mtbNoResult'),
      knex.raw('IFNULL(resultsCount.mtbInvalid, 0) AS mtbInvalid'),
      knex.raw('IFNULL(resultsCount.totalXpertTests, 0) AS totalXpertResults'),
      getDateTimeProjectionInUserTimeZone(knex, 'd.lastPingOn', timezone, 'lastPingOn'),
      getDateTimeProjectionInUserTimeZone(knex, 'resultsCount.lastResultUploadedOn', timezone, 'lastResultUploadedOn'),
      getDateTimeProjectionInUserTimeZone(
        knex,
        'resultsCount.lastResultConductedOn',
        timezone,
        'lastResultConductedOn'
      ),
    ])
}

module.exports = getDevicesWithCountsForTB
