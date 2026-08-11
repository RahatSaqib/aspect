const { knex, sortPageParams, filterDateRangeParams, filterParams } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const {
  getBaseQuery: getResultBaseQuery,
  modifiers,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
} = require('../../result/query')
const { getBasicsForDevicesReport } = require('../common/db')

const {
  mtbDetected,
  mtbNotDetected,
  mtbTraceDetected,
  mtbDetectedRifNotDetected,
  mtbDetectedRifDetected,
  mtbDetectedRifIndeterminate,
  mtbInvalid,
  mtbNoResult,
  mtbError,
} = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
async function getAllDeviceReportDataInternal(dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)

  const resultsCount = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .select({
      deviceId: 'deviceId',
      mtbDetected,
      mtbNotDetected,
      mtbTraceDetected,
      mtbDetectedRifNotDetected,
      mtbDetectedRifDetected,
      mtbDetectedRifIndeterminate,
      mtbInvalid,
      mtbNoResult,
      mtbError,
    })
    .groupBy('r.deviceId')
    .modify(filterParams, query, {
      assayId: 'a.id',
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')

  return {
    builder: deviceQuery
      .clone()
      .leftJoin(resultsCount.as('resultsCount'), function () {
        this.on('resultsCount.deviceId', 'd.id')
      })
      .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
      .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
      /**
       * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
       * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
       * in `api/src/auth/constraints.js` where user permitted deviceType is used
       */
      .whereNotIn('dt.externalId', ['GxAlert', 'Aspect'])
      .groupBy('d.id')
      .modify(sortPageParams, query, 'name')
      .select([
        'd.name',
        's.name AS siteName',
        's.id AS siteId',
        'st.name AS stateName',
        knex.raw('IFNULL(resultsCount.mtbDetected, 0) AS mtbDetected'),
        knex.raw('IFNULL(resultsCount.mtbNotDetected, 0) AS mtbNotDetected'),
        knex.raw('IFNULL(resultsCount.mtbTraceDetected, 0) AS mtbTraceDetected'),
        knex.raw('IFNULL(resultsCount.mtbDetectedRifNotDetected, 0) AS mtbDetectedRifNotDetected'),
        knex.raw('IFNULL(resultsCount.mtbDetectedRifDetected, 0) AS mtbDetectedRifDetected'),
        knex.raw('IFNULL(resultsCount.mtbDetectedRifIndeterminate, 0) AS mtbDetectedRifIndeterminate'),
        knex.raw('IFNULL(resultsCount.mtbInvalid, 0) AS mtbInvalid'),
        knex.raw('IFNULL(resultsCount.mtbNoResult, 0) AS mtbNoResult'),
        knex.raw('IFNULL(resultsCount.mtbError, 0) AS mtbError'),
      ]),
  }
}

// --------------------------------------------------------------------------
async function getAllDeviceReportData(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { builder } = await getAllDeviceReportDataInternal(dataConstraints, query)

  const rows = await builder

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

module.exports = {
  getAllDeviceReportData,
}
