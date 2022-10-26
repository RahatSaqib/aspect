const { knex, sortPageParams, filterDateRangeParams } = require('../../db')
const {
  getBaseQuery: getResultBaseQuery,
  modifiers,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
} = require('../../result/query')
const { XDR_RESISTANCES } = require('../../shared/constants')
const { getBasicsForDevicesReport, moduleAvailability } = require('../common/db')

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

async function getDeviceReportData(dataConstraints, query) {
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
    })
    .groupBy('r.deviceId')

  const deviceInactiveDays = knex
    .from('DeviceMaintenanceStatusLog as dmsl')
    .select(['deviceId', knex.raw('SUM(CASE WHEN dms.active = 0 THEN 1 ELSE 0 END) as totalInactiveDays')])
    .join('DeviceMaintenanceStatus as dms', 'dms.id', 'dmsl.deviceMaintenanceStatusId')
    .modify(filterDateRangeParams, query, 'createdOn')
    .whereRaw('DAYOFWEEK(createdOn) not in (1,7)')
    .groupBy(['deviceId', knex.raw('DATE(createdOn)')])

  return deviceQuery
    .clone()
    .join(resultsCount.as('resultsCount'), function () {
      this.on('resultsCount.deviceId', 'd.id')
    })
    .modify(await moduleAvailability(dataConstraints))
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
      knex.raw('IFNULL(moduleAvailability.enabled, 0) AS totalXpertModulesInUse'),
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
      knex.raw('IFNULL(resultsCount.totalXpertTests, 0) AS totalXpertTests'),
    ])
}

module.exports = {
  getDeviceReportData,
}
