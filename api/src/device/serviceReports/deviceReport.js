const { knex, sortPageParams, filterDateRangeParams } = require('../../db')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { getBasicsForDevicesReport } = require('../common/db')

const xdrExtraColumns = ['INH', 'FLQ', 'AMK', 'KAN', 'CAP', 'ETH'].map(resistance =>
  knex.raw(`SUM(
  CASE WHEN
    JSON_SEARCH(
      r.resultData ->> '$.detectedResistance[*]',
      'one',
      '${resistance}'
    ) IS NOT NULL
  THEN 1 ELSE 0 END) AS ${resistance}`)
)

async function getDeviceReportData(dataConstraints, query) {
  const [issueTypeModuleDisabledId] = await knex('IssueType').where({ name: 'Module Disabled' }).pluck('id')
  const [issueStatusActiveId] = await knex('IssueStatus').where({ name: 'Active' }).pluck('id')

  const { deviceQuery, resultCategoryIds } = await getBasicsForDevicesReport(dataConstraints, query)

  const resultsCount = getResultBaseQuery(knex, dataConstraints)
    .select([
      'deviceId',
      ...xdrExtraColumns,
      knex.raw(
        `sum(case when r.resultCategory1 = ${resultCategoryIds.NotDetected} then 1 else 0 end) as totalMtbNegative`
      ),
      knex.raw(
        `sum(case when r.resultCategory1 = ${resultCategoryIds.Detected} AND r.resultCategory2 = ${resultCategoryIds.NotDetected} then 1 else 0 end) as totalMtbSens`
      ), //
      knex.raw(
        `sum(case when r.resultCategory1 = ${resultCategoryIds.Detected} AND r.resultCategory2 = ${resultCategoryIds.Detected} then 1 else 0 end) as totalMtbRes`
      ), //
      knex.raw(
        `sum(case when r.resultCategory1 = ${resultCategoryIds.Detected} AND (r.resultCategory2 = ${resultCategoryIds.Indeterminate} OR r.resultCategory2 IS NULL) then 1 else 0 end) as totalMtbIndeterminate`
      ),
      knex.raw(`sum(case when r.resultCategory1 = ${resultCategoryIds.Error} then 1 else 0 end) as totalErrors`),
      knex.raw(`sum(case when r.resultCategory1 = ${resultCategoryIds.NoResult} then 1 else 0 end) as mtbNoResult`),
      knex.raw(`sum(case when r.resultCategory1 = ${resultCategoryIds.Invalid} then 1 else 0 end) as mtbInvalid`),
      knex.raw('count(*) AS totalXpertTests'),
    ])
    .groupBy('r.deviceId')

  const lastResults = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.lastResultPerModule, knex)
    .select([
      'r.deviceId',
      knex.raw('r.resultData ->> "$.moduleName" as moduleName'),
      'r.createdOn as resultDate',
      'r.moduleSerial as moduleSerial',
    ])
    .whereRaw('r.resultData ->> "$.moduleName" is not null')

  const deviceInactiveDays = knex
    .from('DeviceMaintenanceStatusLog as dmsl')
    .select(['deviceId', knex.raw('SUM(CASE WHEN dms.active = 0 THEN 1 ELSE 0 END) as totalInactiveDays')])
    .join('DeviceMaintenanceStatus as dms', 'dms.id', 'dmsl.deviceMaintenanceStatusId')
    .modify(filterDateRangeParams, query, 'createdOn')
    .whereRaw('DAYOFWEEK(createdOn) not in (1,7)')
    .groupBy(['deviceId', knex.raw('DATE(createdOn)')])

  const moduleAvailability = knex
    .from(lastResults.as('lastResult'))
    .leftJoin('Issue as issueModuleDisabled', function () {
      this.on('issueModuleDisabled.deviceId', 'lastResult.deviceId')
        .andOn('lastResult.moduleSerial', knex.raw('issueModuleDisabled.data ->> "$.moduleSerial"'))
        .andOn('issueModuleDisabled.issueTypeId', issueTypeModuleDisabledId)
        .andOn('issueModuleDisabled.issueStatusId', issueStatusActiveId)
    })
    .select([
      'lastResult.deviceId',
      knex.raw('sum(case when issueModuleDisabled.id is null then 1 else 0 end) as enabled'),
      knex.raw('sum(case when issueModuleDisabled.id is null then 0 else 1 end) as disabled'),
    ])
    .groupBy('lastResult.deviceId')

  return deviceQuery
    .clone()
    .join(resultsCount.as('resultsCount'), function () {
      this.on('resultsCount.deviceId', 'd.id')
    })
    .leftJoin(moduleAvailability.as('moduleAvailability'), function () {
      this.on('moduleAvailability.deviceId', 'd.id')
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
      knex.raw('IFNULL(moduleAvailability.enabled, 0) AS totalXpertModulesInUse'),
      knex.raw('IFNULL(resultsCount.INH, 0) AS INH'),
      knex.raw('IFNULL(resultsCount.FLQ, 0) AS FLQ'),
      knex.raw('IFNULL(resultsCount.AMK, 0) AS AMK'),
      knex.raw('IFNULL(resultsCount.KAN, 0) AS KAN'),
      knex.raw('IFNULL(resultsCount.CAP, 0) AS CAP'),
      knex.raw('IFNULL(resultsCount.ETH, 0) AS ETH'),
      knex.raw('IFNULL(deviceInactiveDays.totalInactiveDays, 0) AS totalInterruptedDays'),
      knex.raw('IFNULL(resultsCount.totalMtbNegative, 0) AS totalMtbNegative'),
      knex.raw('IFNULL(resultsCount.totalMtbSens, 0) AS totalMtbSens'),
      knex.raw('IFNULL(resultsCount.totalMtbRes, 0) AS totalMtbRes'),
      knex.raw('IFNULL(resultsCount.totalMtbIndeterminate, 0) AS totalMtbIndeterminate'),
      knex.raw('IFNULL(resultsCount.totalErrors, 0) AS totalErrors'),
      knex.raw('IFNULL(resultsCount.mtbNoResult, 0) AS mtbNoResult'),
      knex.raw('IFNULL(resultsCount.mtbInvalid, 0) AS mtbInvalid'),
      knex.raw('IFNULL(resultsCount.totalXpertTests, 0) AS totalXpertTests'),
    ])
}

module.exports = {
  getDeviceReportData,
}
