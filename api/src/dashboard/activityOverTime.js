const _ = require('lodash')
const isWeekend = require('date-fns/isWeekend')
const format = require('date-fns/format')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getArrayOfDaysInRange } = require('../shared/date')

async function activityOverTimeDashboard(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  // build up array of days in date range. makes querying easier:
  let days = getArrayOfDaysInRange(query.minDate, query.maxDate, {
    devicesActive: 0,
    devicesInactive: 0,
    devicesTotal: 0,
    inactiveUnknown: 0,
    inactiveNoResultsReported: 0,
    inactiveOutOfInventory: 0,
    inactiveDownForRepair: 0,
    inactiveConnectivity: 0,
    inactiveDecommissioned: 0,
  })

  const allCountsBase = knex('Device as d')
    // inner joins
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    // left joins
    .leftOuterJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin(
      'DeviceMaintenanceStatusLog as dmsl',
      'd.id',
      'dmsl.deviceId'
    )
    .leftOuterJoin(
      'DeviceMaintenanceStatus as dms',
      'dmsl.deviceMaintenanceStatusId',
      'dms.id'
    )
    // explicitly limit device type categories (skip Connector)
    .whereIn('dtc.name', ['Lab', 'Integrated', 'Information System'])
    // only for Cepheid GX
    .where('dt.externalId', 'CepheidGeneXpert')
    // apply constraints
    .modify(addConstraints, dataConstraints, {
      site: 's',
      device: 'd',
      deviceType: 'dt',
      geography: 'g',
    })
    .whereRaw('dmsl.day >= ? AND dmsl.day <= ?', [
      format(query.minDate, 'yyyy-MM-dd'),
      format(query.maxDate, 'yyyy-MM-dd'),
    ])
    .select('dmsl.day AS dayDate')
    .count({
      devicesTotal: knex.raw(`DISTINCT d.id`),
      devicesActive: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId IN ('active', 'reportedActive')
          THEN d.id ELSE null
        END`),
      // -----------
      // Count different inactive maintenance statuses
      // -----------
      inactiveUnknown: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveUnknown'
          THEN d.id ELSE null
        END`),
      inactiveNoResultsReported: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveNoResultsReported'
          THEN d.id ELSE null
        END`),
      inactiveOutOfInventory: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveOutOfInventory'
          THEN d.id ELSE null
        END`),
      inactiveDownForRepair: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveDownForRepair'
          THEN d.id ELSE null
        END`),
      inactiveConnectivity: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveConnectivity'
          THEN d.id ELSE null
        END`),
      inactiveDecommissioned: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveDecommissioned'
          THEN d.id ELSE null
        END`),
    })
    .groupBy('dayDate')

  const allCounts = await allCountsBase

  // update the devices counts for each day in the range
  days = days.map(day => {
    const dayCounts = allCounts.find(
      ({ dayDate }) =>
        format(day.date, 'yyyy-MM-dd') === format(dayDate, 'yyyy-MM-dd')
    )
    if (dayCounts) {
      day = {
        ...day,
        ..._.omit(dayCounts, ['dayDate']),
      }
      day.devicesInactive = day.devicesTotal - day.devicesActive
    }
    day.isWeekendOrHoliday = isWeekend(day.date)
    return day
  })

  return {
    ok: true,
    data: days,
  }
}

module.exports = activityOverTimeDashboard
