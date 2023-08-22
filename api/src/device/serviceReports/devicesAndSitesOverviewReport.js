const _ = require('lodash')
const { knex, sortPageParams, filterDateRangeParams, filterParams } = require('../../db')
const { getGeneXpertInventoryBySitesAndConsumableQuery } = require('../../inventory/common/db')
const { getConstraints } = require('../../auth/constraints')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { getBasicsForDevicesReport } = require('../common/db')
const { getOffsetFromIsoDateString, getDateTimeProjectionInUserTimeZone } = require('../../shared/date')

// --------------------------------------------------------------------------
const resultCategoryGroupSum = (assayId, rc1, rc2) => {
  let query = `IFNULL(SUM(CASE WHEN r.assayId IN (${assayId}) AND r.resultCategory1 = ${rc1} `

  if (rc2) {
    query += `AND r.resultCategory2 = ${rc2} `
  } else {
    query += `AND r.resultCategory2 IS NULL `
  }

  query += 'THEN 1 ELSE 0 END), 0)'

  return knex.raw(query)
}

async function getAllDeviceReportData(resultCategoryGroups, dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)
  const { maxDate = new Date() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

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
      ...Object.fromEntries(
        resultCategoryGroups.map(ac => {
          return [ac.columnKey, resultCategoryGroupSum(ac.assayId, ac.resultCategory1Id, ac.resultCategory2Id)]
        })
      ),
      otherTests: knex.raw('IFNULL(SUM(CASE WHEN rcg.id IS NULL THEN 1 ELSE 0 END), 0)'),
      totalXpertTests: knex.raw('count(*)'),
      lastUploadOn: getDateTimeProjectionInUserTimeZone(knex, 'MAX(r.updatedOn)', offset),
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

  const data = await getGeneXpertInventoryBySitesAndConsumableQuery(
    { query: _.omit(query, ['minDate', 'maxDate']), auth },
    dataConstraints,
    null,
    [
      't2.siteName',
      't2.consumableName',
      't2.dailyConsumptionRate',
      knex.raw('t2.dailyConsumptionRate * 365 as projectedAnnualConsumption'),
      't2.quantityOnHand',
      't2.daysStockLeft',
      't2.projectedWaste',
      't2.qtyExpired as quantityExpired',
    ]
  )
    .whereRaw('t2.quantityOnHand IS NOT NULL')
    .orderBy(['t2.siteName', 't2.consumableName'])

  return {
    ok: true,
    data,
  }
}

module.exports = {
  getAllDeviceReportData,
  getInventoryData,
}
