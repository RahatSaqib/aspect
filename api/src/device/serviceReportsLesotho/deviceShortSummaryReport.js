const _ = require('lodash')
const { knex, sortPageParams, filterDateRangeParams, filterParams } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { getBasicsForDevicesReport, getResultCategoryGroupColumns } = require('../common/db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

// --------------------------------------------------------------------------
const {
  getResultCategoryGroupSumSelector,
  getResultXdrResistanceSumSelector,
} = require('../../result/query/querySelectors')

// --------------------------------------------------------------------------
async function getAllDeviceReportDataInternal(resultCategoryGroups, dataConstraints, query, timezoneIANA) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)

  const resultCategoryGroupsColumns = Object.fromEntries(
    resultCategoryGroups.map(ac => {
      if (!_.isNil(ac.resultCategory1Id) || !_.isNil(ac.resultCategory2Id))
        // Counts a result category group
        return [ac.columnKey, getResultCategoryGroupSumSelector(ac.assayId, ac.resultCategory1Id, ac.resultCategory2Id)]

      // Counts an xdr resistance result
      return [ac.columnKey, getResultXdrResistanceSumSelector(ac.xdrResistance)]
    })
  )

  const resultsCount = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
    .leftJoin('ResultCategoryGroup as rcg', joinQuery => {
      joinQuery
        .on('rcg.assayId', 'a.id')
        .andOn('rcg.resultCategory1Id', 'rc1.id')
        .andOn(knex.raw('rcg.resultCategory2Id <=> rc2.id'))
    })
    .select({
      deviceId: 'deviceId',
      totalXpertTests: knex.raw('count(*)'),
      ...resultCategoryGroupsColumns,
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
      .whereNot('dt.externalId', 'GxAlert')
      .groupBy('d.id')
      .modify(sortPageParams, query, 'name')
      .select([
        'd.name',
        's.name AS siteName',
        's.id AS siteId',
        'st.name AS stateName',
        ...resultCategoryGroups.map(a => knex.raw(`IFNULL(resultsCount.${a.columnKey}, 0) AS ${a.columnKey}`)),
        knex.raw('IFNULL(resultsCount.totalXpertTests, 0) AS totalXpertTests'),
      ]),
  }
}

// --------------------------------------------------------------------------
async function getAllDeviceReportDataWrapper(auth, query, timezone) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryGroups = await getResultCategoryGroupColumns(dataConstraints, query)
  const { builder } = await getAllDeviceReportDataInternal(resultCategoryGroups, dataConstraints, query, timezone)
  const rows = await builder

  return {
    ok: true,
    data: rows,
    total: rows.length,
    dynamicColumns: resultCategoryGroups.map(a => ({
      key: a.columnKey,
      header: a.columnName,
    })),
  }
}

module.exports = {
  getAllDeviceReportData: getAllDeviceReportDataWrapper,
}
