const { knex, sortPageParams, filterDateRangeParams } = require('../../db')
const {
  getBaseQuery: getResultBaseQuery,
  modifiers,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
} = require('../../result/query')
const { getDateTimeProjectionInUserTimeZone, getOffsetFromIsoDateString } = require('../../shared/date')
const { getBasicsForDevicesReport } = require('../common/db')

async function getAllDeviceReportData(dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)
  const { maxDate = new Date() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

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
      lastUploadOn: getDateTimeProjectionInUserTimeZone(knex, 'MAX(r.endedOn)', offset),
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
    .where('dt.externalId', 'CepheidGeneXpert')
    .groupBy('d.id')
    .modify(sortPageParams, query, 'name')
    .select([
      'd.name',
      's.name AS siteName',
      'st.name AS stateName',
      'lg.name AS districtName',
      'd.serial AS serial',
      'd.lastInstrumentSerial AS instrumentSerial',
      getDateTimeProjectionInUserTimeZone(knex, 'd.lastPingOn', offset, 'lastPingOn'),
      'd.lastPingFromIp AS lastPingFrom',
      knex.raw('d.ConfigurationData ->> "$.connectSettingsSentOn" AS informationDate'),
      knex.raw('d.ConfigurationData ->> "$.computerOsVersion" AS operativeSystem'),
      'd.timezone AS timeZone',
      'd.culture AS language',
      knex.raw('d.ConfigurationData ->> "$.gxConnectVersion" AS gxConnectVersion'),
      knex.raw('d.ConfigurationData ->> "$.databaseDeviceOk" AS deviceFound'),
      knex.raw('d.ConfigurationData ->> "$.lisConfigOk" AS lisConfiguredCorrectly'),
      'd.putInService AS instalationDate',
      'resultsCount.lastUploadOn AS lastUploadOn',

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
      knex.raw('IFNULL(resultsCount.totalXpertTests, 0) AS totalXpertTests'),
    ])
}

module.exports = {
  getAllDeviceReportData,
}
