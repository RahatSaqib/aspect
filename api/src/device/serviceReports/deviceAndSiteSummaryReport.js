const _ = require('lodash')
const { knex, sortPageParams, filterDateRangeParams, filterParams } = require('../../db')
const { getInventoryBySitesAndConsumableQuery } = require('../../inventory/common/db')
const { getConstraints } = require('../../auth/constraints')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { getBasicsForDevicesReport } = require('../common/db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

// --------------------------------------------------------------------------
const {
  getResultCategoryGroupSumSelector,
  getResultXdrResistanceSumSelector,
} = require('../../result/query/querySelectors')

// --------------------------------------------------------------------------
async function getAllDeviceReportData(resultCategoryGroups, dataConstraints, query, timezoneIANA) {
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
      otherTests: knex.raw('IFNULL(SUM(CASE WHEN rcg.id IS NULL THEN 1 ELSE 0 END), 0)'),
      totalXpertTests: knex.raw('count(*)'),
      lastUploadOn: knex.raw('MAX(r.updatedOn)'),
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
        'lg.name AS districtName',
        'd.serial AS serial',
        'd.lastInstrumentSerial AS instrumentSerial',
        getDateTimeProjectionInTimeZoneIANA(knex, 'd.lastPingOn', timezoneIANA, 'lastPingOn'),
        'd.lastPingFromIp AS lastPingFrom',
        getDateTimeProjectionInTimeZoneIANA(
          knex,
          'COALESCE(configurationData->>"$.systemTime.localTime", configurationData->>"$.systemTime")',
          timezoneIANA,
          'informationDate'
        ),
        knex.raw('d.ConfigurationData ->> "$.computerOsVersion" AS operativeSystem'),
        'd.timezone AS timeZone',
        'd.culture AS language',
        knex.raw('d.ConfigurationData ->> "$.gxConnectVersion" AS gxConnectVersion'),
        knex.raw('d.ConfigurationData ->> "$.databaseDeviceOk" AS deviceFound'),
        knex.raw('d.ConfigurationData ->> "$.lisConfigOk" AS lisConfiguredCorrectly'),
        // The deviceApi doesn't populate d.putInService well, so we are going to get it from configurationData until we fix that
        getDateTimeProjectionInTimeZoneIANA(
          knex,
          'COALESCE(d.putInService, d.configurationData->>"$.putInService")',
          timezoneIANA,
          'instalationDate'
        ),
        getDateTimeProjectionInTimeZoneIANA(knex, 'resultsCount.lastUploadOn', timezoneIANA, 'lastUploadOn'),
        knex.raw('dms.name AS status'),
        knex.raw('dmsl.data ->> "$.notes" AS statusNote'),
        ...resultCategoryGroups.map(a => knex.raw(`IFNULL(resultsCount.${a.columnKey}, 0) AS ${a.columnKey}`)),
        knex.raw('IFNULL(resultsCount.totalXpertTests, 0) AS totalXpertTests'),
        knex.raw('IFNULL(resultsCount.otherTests, 0) AS totalOtherTests'),
      ]),
  }
}

// --------------------------------------------------------------------------
async function getInventoryData(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const dataQuery = getInventoryBySitesAndConsumableQuery(
    { query: _.omit(query, ['minDate', 'maxDate']), auth },
    dataConstraints,
    null,
    [
      't2.siteName',
      't2.consumableName',
      knex.raw('COALESCE(t2.dailyConsumptionRate, 0) as dailyConsumptionRate'),
      knex.raw('COALESCE(t2.dailyConsumptionRate, 0) * 365 as projectedAnnualConsumption'),
      knex.raw('COALESCE(t2.quantityOnHand, 0) as quantityOnHand'),
      knex.raw('COALESCE(t2.daysStockLeft, 0) as daysStockLeft'),
      knex.raw('COALESCE(t2.projectedWaste, 0) as projectedWaste'),
      knex.raw('COALESCE(t2.qtyExpired, 0) as quantityExpired'),
    ]
  )
    .leftJoin(
      function () {
        this.select('*')
          .from('Result')
          .whereNull('reconciliationDate')
          .whereBetween('endedOn', [query.minDate, query.maxDate])
          .as('r')
      },
      'r.siteId',
      't2.siteId'
    )
    .leftJoin('ConsumableAssay AS ca', join => {
      join.on('ca.assayId', '=', 'r.assayId')
      join.on('ca.consumableId', '=', 't2.consumableId')
    })
    .having('quantityOnHand', '>', 0)
    .orHaving('unreconciledResults', '>', 0)
    .groupBy('t2.siteName', 't2.consumableName')
    .orderBy(['t2.siteName', 't2.consumableName'])
    .select({ unreconciledResults: knex.raw('COUNT(CONCAT(r.siteId, "-", ca.consumableId))') })

  const data = await dataQuery

  return {
    ok: true,
    data,
  }
}

module.exports = {
  getAllDeviceReportData,
  getInventoryData,
}
