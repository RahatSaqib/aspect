const { merge, orderBy, keyBy, keys, min } = require('lodash')
const Promise = require('bluebird')
const { parseISO } = require('date-fns')
const { knex } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { filterDateRangeParams, filterParams } = require('../../db')
const { getArrayOfDaysInRange } = require('../../shared/date')

// Translate the report wire-level flags into the deviceApprovals token set
function deviceApprovalsFor(query) {
  const deviceApprovals = ['approved']
  if (query.showUndeployedDevices) deviceApprovals.push('pendingDeployment')
  if (query.showDecommissionedDevices) deviceApprovals.push('decommissioned')
  return deviceApprovals
}

function getResultsBaseQuery(query) {
  const now = new Date()
  const days = getArrayOfDaysInRange(
    parseISO(query.minDate),
    parseISO(min([query.maxDate, now.toISOString()])),
    null,
    true
  )

  return knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .leftOuterJoin('Result as r', joinResult => {
      joinResult
        .on('d.id', 'r.deviceId')
        .andOn(knex.raw('r.endedOn'), '>', knex.raw(`'${query.minDate}'`))
        .andOn(knex.raw('r.endedOn'), '<=', knex.raw(`'${query.maxDate}'`))
    })
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .whereNot('dt.externalId', 'GxAlert')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .groupBy(['d.id'])
    .select([
      'd.id as deviceId',
      'd.name as deviceName',
      'st.name as state',
      'lg.name as lga',
      knex.raw(`ROUND(SUM(CASE WHEN rc1.externalId = 'Error' THEN 1 ELSE 0 END) * 100 / COUNT(r.id), 2) as errorRate`),
      knex.raw(`IFNULL(ROUND(COUNT(r.id) * 100 / (${days.length} * d.dailyTestCapacity), 2), 0) as utilizationRate`),
      knex.raw(
        `IFNULL(ROUND(SUM(TIMESTAMPDIFF(MINUTE, IFNULL(r.endedOn, NOW()), r.createdOn)) / 60 / COUNT(r.id), 2), 0) as averageDelayToUpload`
      ),
      knex.raw('COUNT(r.id) as totalTests'),
    ])
}

function getMaintenanceBaseQuery(dataConstraints, query) {
  return (
    knex('Device as d')
      .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .innerJoin('Site as s', 's.id', 'd.siteId')
      .innerJoin('Geography as g', 's.geographyId', 'g.id')
      .leftOuterJoin('State as st', 'g.stateId', 'st.id')
      .leftOuterJoin('Lga as lg', 'g.lgaId', 'lg.id')
      .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl', 'd.id', 'dmsl.deviceId')
      .leftOuterJoin('DeviceMaintenanceStatusLog as dmslNewer', queryBuilder => {
        queryBuilder
          .on('dmslNewer.deviceId', 'dmsl.deviceId')
          .andOn('dmslNewer.day', 'dmsl.day')
          .andOn(function () {
            this.on('dmslNewer.createdOn', '>', 'dmsl.createdOn')
            this.orOn(function () {
              this.on('dmslNewer.createdOn', '=', 'dmsl.createdOn').andOn('dmslNewer.id', '>', 'dmsl.id')
            })
          })
      })
      .leftOuterJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
      /**
       * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
       * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
       * in `api/src/auth/constraints.js` where user permitted deviceType is used
       */
      .whereNot('dt.externalId', 'GxAlert')
      // Get only the latest log of the day
      .whereNull('dmslNewer.id')
      .whereRaw(`DAYOFWEEK(dmsl.day) <> 1 AND DAYOFWEEK(dmsl.day) <> 7`)
      .modify(
        addConstraints,
        dataConstraints,
        {
          device: 'd',
          site: 's',
          geography: 'g',
          deviceType: 'dt',
        },
        { deviceApprovals: deviceApprovalsFor(query) }
      )
      .modify(filterDateRangeParams, query, 'dmsl.day')
      .modify(filterParams, query, {
        countryId: 'g.countryId',
        stateId: 'g.stateId',
        lgaId: 'g.lgaId',
        siteName: 's.name',
      })
      .groupBy(['d.id'])
      .select([
        'd.id as deviceId',
        'd.name as deviceName',
        'st.name as state',
        'lg.name as lga',
        knex.raw(`ROUND(SUM(CASE WHEN dms.active THEN 0 ELSE 1 END) * 100 / COUNT(dms.id)) as offlineRate`),
        knex.raw(`ROUND(SUM(dms.active) * 100 / COUNT(dms.id)) as activeRate`),
      ])
  )
}

async function getDevicePerformanceReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const [resultBasedData, maintenanceBasedData] = await Promise.all([
    getResultsBaseQuery(query)
      .modify(
        addConstraints,
        dataConstraints,
        {
          device: 'd',
          site: 's',
          geography: 'g',
          partner: 'p',
        },
        { deviceApprovals: deviceApprovalsFor(query) }
      )
      .orderBy(['state', 'lga', 'deviceName']),
    getMaintenanceBaseQuery(dataConstraints, query).orderBy(['state', 'lga', 'deviceName']),
  ])

  // Group by deviceId
  const resultBasedDataByDevice = keyBy(resultBasedData, 'deviceId')
  const maintenanceBasedDataByDevice = keyBy(maintenanceBasedData, 'deviceId')

  // Merge by deviceId
  let data = []
  keys(resultBasedDataByDevice).forEach(deviceId => {
    data.push(merge(resultBasedDataByDevice[deviceId], maintenanceBasedDataByDevice[deviceId]))
  })
  data = orderBy(data, ['state', 'lga', 'deviceName'])

  return {
    ok: true,
    data,
  }
}

async function getDevicePerformanceReportByAssay(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await getResultsBaseQuery(query)
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        site: 's',
        geography: 'g',
        partner: 'p',
        assay: 'a',
      },
      { deviceApprovals: deviceApprovalsFor(query) }
    )
    .groupBy('r.assayId')
    .orderBy(['state', 'lga', 'deviceName', 'a.name'])
    .select(['a.name as assayName', knex.raw('COUNT(r.id) as totalTests')])

  return {
    ok: true,
    data,
  }
}

module.exports = {
  getDevicePerformanceReport,
  getDevicePerformanceReportByAssay,
}
