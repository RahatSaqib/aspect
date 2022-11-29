const { knex, sortPageParams, filterDateRangeParams } = require('../../db')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { getDateTimeProjectionInUserTimeZone, getOffsetFromIsoDateString } = require('../../shared/date')
const { getBasicsForDevicesReport } = require('../common/db')

async function getAllDeviceReportData(assays, dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)
  const { maxDate = new Date() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

  const assaySum = (rc1, rc2) => {
    let query = `IFNULL(SUM(CASE WHEN r.resultCategory1 = ${rc1} `

    if (rc2) {
      query += `AND r.resultCategory2 = ${rc2} `
    }

    query += 'THEN 1 ELSE 0 END), 0)'

    return knex.raw(query)
  }

  const resultsCount = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
    .select({
      deviceId: 'deviceId',
      ...Object.fromEntries(
        assays.map(ac => {
          return [ac.columnKey, assaySum(ac.resultCategory1Id, ac.resultCategory2Id)]
        })
      ),
      totalXpertTests: knex.raw('count(*)'),
      lastUploadOn: getDateTimeProjectionInUserTimeZone(knex, 'MAX(r.endedOn)', offset),
    })
    .groupBy('r.deviceId')
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra', 'GxMtbXdr'])
    .modify(filterDateRangeParams, query, 'r.endedOn')

  return deviceQuery
    .clone()
    .leftJoin(resultsCount.as('resultsCount'), function () {
      this.on('resultsCount.deviceId', 'd.id')
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
      ...assays.map(a => knex.raw(`IFNULL(resultsCount.${a.columnKey}, 0) AS ${a.columnKey}`)),
      knex.raw('IFNULL(resultsCount.totalXpertTests, 0) AS totalXpertTests'),
    ])
}

module.exports = {
  getAllDeviceReportData,
}
