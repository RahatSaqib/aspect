const { merge, orderBy, keyBy, keys, min, join } = require('lodash')
const Promise = require('bluebird')
const { parseISO } = require('date-fns')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { filterDateRangeParams, filterParams } = require('../db')
const { getArrayOfDaysInRange } = require('../shared/date')

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
    .leftOuterJoin('DeviceCapacity as dc', 'd.deviceCapacityId', 'dc.id')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .where('dt.externalId', 'CepheidGeneXpert')
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
      knex.raw(
        `ROUND(SUM(CASE WHEN rc1.externalId = 'Error' THEN 1 ELSE 0 END) * 100 / COUNT(r.id), 2) as errorRate`
      ),
      knex.raw(
        `IFNULL(ROUND(COUNT(r.id) * 100 / (${days.length} * dc.dailyCapacity), 2), 0) as utilizationRate`
      ),
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
      .leftOuterJoin(
        'DeviceMaintenanceStatusLog as dmsl',
        'd.id',
        'dmsl.deviceId'
      )
      .leftOuterJoin(
        'DeviceMaintenanceStatusLog as dmslNewer',
        queryBuilder => {
          queryBuilder
            .on('dmslNewer.deviceId', 'dmsl.deviceId')
            .andOn('dmslNewer.day', 'dmsl.day')
            .andOn(function () {
              this.on('dmslNewer.createdOn', '>', 'dmsl.createdOn')
              this.orOn(function () {
                this.on('dmslNewer.createdOn', '=', 'dmsl.createdOn').andOn(
                  'dmslNewer.id',
                  '>',
                  'dmsl.id'
                )
              })
            })
        }
      )
      .leftOuterJoin(
        'DeviceMaintenanceStatus as dms',
        'dmsl.deviceMaintenanceStatusId',
        'dms.id'
      )
      // Get only the latest log of the day
      .where('dt.externalId', 'CepheidGeneXpert')
      .whereNull('dmslNewer.id')
      .whereRaw(`DAYOFWEEK(dmsl.day) <> 1 AND DAYOFWEEK(dmsl.day) <> 7`)
      .modify(addConstraints, dataConstraints, {
        device: 'd',
        site: 's',
        geography: 'g',
        deviceType: 'dt',
      })
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
        knex.raw(
          `ROUND(SUM(CASE WHEN dms.active THEN 0 ELSE 1 END) * 100 / COUNT(dms.id)) as offlineRate`
        ),
        knex.raw(`ROUND(SUM(dms.active) * 100 / COUNT(dms.id)) as activeRate`),
      ])
  )
}

async function getDevicePerformanceReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const [resultBasedData, maintenanceBasedData] = await Promise.all([
    getResultsBaseQuery(query)
      .modify(addConstraints, dataConstraints, {
        device: 'd',
        site: 's',
        geography: 'g',
        partner: 'p',
      })
      .orderBy(['state', 'lga', 'deviceName']),
    getMaintenanceBaseQuery(dataConstraints, query).orderBy([
      'state',
      'lga',
      'deviceName',
    ]),
  ])

  // Group by deviceId
  const resultBasedDataByDevice = keyBy(resultBasedData, 'deviceId')
  const maintenanceBasedDataByDevice = keyBy(maintenanceBasedData, 'deviceId')

  // Merge by deviceId
  let data = []
  keys(resultBasedDataByDevice).forEach(deviceId => {
    data.push(
      merge(
        resultBasedDataByDevice[deviceId],
        maintenanceBasedDataByDevice[deviceId]
      )
    )
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
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      partner: 'p',
      assay: 'a',
    })
    .groupBy('r.assayId')
    .orderBy(['state', 'lga', 'deviceName', 'a.name'])
    .select(['a.name as assayName', knex.raw('COUNT(r.id) as totalTests')])

  return {
    ok: true,
    data,
  }
}

async function getModuleActivityReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  // const { culture } = await getUser(auth.credentials.name)
  const { minDate } = query

  const maxResultBeforeMinDateSubquery = knex('Result as r')
    .where('r.endedOn', '<', minDate)
    .max('id')
    .groupBy('r.deviceId', 'r.moduleName')

  const q = knex('Result as r')
    .where('r.id', 'in', maxResultBeforeMinDateSubquery)
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin(
      'Issue as i',
      'i.id',
      knex('Issue as ilast')
        .whereRaw('ilast.deviceId = r.deviceId')
        .andWhereRaw('ilast.data->>"$.moduleName" = r.moduleName')
        .max('ilast.id')
    )
    .leftJoin('IssueType as it', 'it.id', 'i.issueTypeId')
    .whereNotExists(function () {
      // filter bays with results beyond mindate
      this.from('Result as r2')
        .whereRaw('r2.deviceId = r.deviceId')
        .whereRaw('r2.moduleName = r.moduleName')
        .where('r2.endedOn', '>', minDate)
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .select([
      'd.name as deviceName',
      knex.raw(`ifnull(r.moduleName, 'not informed') as moduleName`),
      'r.moduleSerial',
      knex.raw('max(r.endedOn) as lastSeen'),
      'it.name as lastIssue',
      'i.updatedOn as dateLastIssue',
    ])
    .groupBy('r.deviceId', 'r.moduleName')
    .orderBy([
      { column: 'lastSeen', order: 'desc' },
      'r.deviceId',
      'r.moduleName',
    ])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      partner: 'p',
    })
    .modify(filterParams, query, {
      // countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })

  //   SELECT
  //     d.name Device,
  //     r.moduleName,
  //     r.moduleSerial,
  //     r.endedOn,
  //     r.id resultId,
  //     i.id,
  //     i.resultId,
  //     it.name lastError,
  //     i.updatedOn lastErrorDate
  // FROM
  // Result as r join
  //     (SELECT  MAX(id) rid
  // 		FROM Result AS r
  // 		WHERE r.endedOn < '2021-01-01T00:00:00.000-03:00'
  // 		GROUP BY r.moduleName , r.deviceId) g
  // 		on r.id = g.rid
  // 	LEFT JOIN Issue as i on i.id = (select max(i.id) from Issue as i where i.deviceId = r.deviceId and i.data->>"$.moduleName" = r.moduleName)
  // 	LEFT JOIN IssueType as it on it.id = i.issueTypeId
  //     Join Device d on r.deviceId = d.id
  //     where NOT EXISTS(
  // 			SELECT *
  // 			FROM Result AS r2
  // 			WHERE r2.deviceId = r.deviceId
  //                 AND r2.moduleName = r.moduleName
  //                 AND r2.endedOn > '2021-01-01T00:00:00.000-03:00')
  // -- and r.deviceId = 22 and moduleName = 'A4'
  //     order by d.deviceId, moduleName;
  // **************************************************************************
  // const q = knex('Result as r')
  //   .innerJoin('Device as d', 'r.deviceId', 'd.id')
  //   .innerJoin('Site as s', 's.id', 'r.siteId')
  //   .innerJoin('Geography as g', 's.geographyId', 'g.id')
  //   .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
  //   .leftJoin('Issue as i', 'i.resultId', 'r.id')
  //   .where('r.endedOn', '<', minDate)
  //   .select([
  //     'r.deviceId',
  //     'd.name as deviceName',
  //     knex.raw(`ifnull(r.moduleName, 'not informed') as moduleName`),
  //     'r.moduleSerial',
  //     knex.raw('max(r.endedOn) as lastSeen'),
  //   ])
  //   .where(function () {
  //     this.whereNull('i.id').orWhereIn(
  //       'i.id',
  //       knex('Issue as i2').where('i2.resultId', 'r.id').max('id')
  //     )
  //   })
  // //   .whereNotExists(function () {
  // //     // filter results beyond mindate in same slot
  // //     this.from('Result as r2')
  // //       .whereRaw('r2.deviceId = r.deviceId')
  // //       .whereRaw('r.moduleName = r2.moduleName')
  // //       .where('r2.endedOn', '>', minDate)
  // //   })
  //   .whereNotExists(function () {
  //     // filter results beyond mindate with same module in any device and slot
  //     this.from('Result as replacement')
  //       .whereRaw('replacement.moduleSerial = r.moduleSerial')
  //       .where('replacement.endedOn', '>', minDate)
  //   })
  //   .where('dt.externalId', 'CepheidGeneXpert')
  //   .where('d.name', 'not like', '%Stefan%')
  //   .groupBy('r.deviceId', 'r.moduleName', 'r.moduleSerial')
  //   .orderBy([
  //     { column: 'lastSeen', order: 'desc' },
  //     'r.deviceId',
  //     'r.moduleName',
  //   ])

  console.log('\x1b[1;34m', q.toString())
  const rows = await q
  return {
    ok: true,
    data: rows,
    total: rows.length,
    dataSelector: dataRow => {
      return dataRow
    },
  }
}

module.exports = {
  getDevicePerformanceReport,
  getDevicePerformanceReportByAssay,
  getModuleActivityReport,
}
