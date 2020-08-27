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
  // base query for all actual devices
  const allDevicesBase = knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .leftOuterJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .whereNot('da.token', 'decommissioned')
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
    .count({
      devicesTotal: knex.raw(`DISTINCT d.id`),
    })

  // total number of all accessible devices
  const { devicesTotal } = await allDevicesBase.clone().first()

  /**
  Notice that cron job `logDeviceMaintenanceStatus` populates table
  DeviceMaintenanceStatusLog every day. This job makes sure all devices have
  entry in log table for each day.

  So, below query should have counts (especially total # of devices)
  for each date in range. But because seeding of `development` env
  may miss adding logs for some days (i.e. for weekends), we use default 
  value of `devicesTotal` in case when below query doesn't have data for
  some day in table DeviceMaintenanceStatusLog.
  */

  // count devices by different statuses
  const allCounts = await allDevicesBase
    .clone()
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
    .whereRaw('dmsl.day >= ? AND dmsl.day <= ?', [
      format(query.minDate, 'yyyy-MM-dd'),
      format(query.maxDate, 'yyyy-MM-dd'),
    ])
    .select(`dmsl.day AS dayDate`)
    .groupBy('dayDate')
    // additional counts
    .count({
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
    } else {
      day = {
        ...day,
        devicesTotal,
      }
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
