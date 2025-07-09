const min = require('lodash/min')
const omit = require('lodash/omit')
const format = require('date-fns/format')
const addDays = require('date-fns/addDays')
const addMinutes = require('date-fns/addMinutes')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getArrayOfDaysInRange, getOffsetFromIsoDateStringInMinutes, formatDateOrDefault } = require('../shared/date')
const { getPartnerWorkingDaysConfig } = require('../partner/common/db')

async function activityOverTimeDashboard(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const customWorkingDaysConfig = await getPartnerWorkingDaysConfig(auth)

  const offset = getOffsetFromIsoDateStringInMinutes(query.minDate)
  const minDate = addMinutes(new Date(query.minDate), offset)
  const maxDate = addMinutes(new Date(query.maxDate), offset)

  // build up array of days in date range, excluding today because it could be incomplete. It makes querying easier:
  let days = getArrayOfDaysInRange(minDate, min([maxDate, addDays(new Date(), -1)]), {
    devicesActive: 0,
    devicesInactive: 0,
    devicesTotal: 0,
    inactiveUnknown: 0,
    inactiveNoTestsPerformed: 0,
    inactiveOutOfInventory: 0,
    inactiveDownForRepair: 0,
    inactiveNoStaff: 0,
    inactiveNoSamples: 0,
    inactiveNoPower: 0,
    inactiveOther: 0,
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
    /**
     * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
     * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
     * in `api/src/auth/constraints.js` where user permitted deviceType is used
     */
    .whereNot('dt.externalId', 'GxAlert')
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
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl', 'd.id', 'dmsl.deviceId')
    // left join to the same table DeviceMaintenanceStatusLog for the same
    // 'day' and 'deviceId' and make sure we deal with LATEST entry for `dmsl` -
    // i.e. for this we do dmsl2.createdOn > dmsl.createdOn, and if date are equal
    // then we get recently added entry with dmsl2.id > dmsl.id.
    // And then in WHERE section we do 'dmsl2.id IS NULL' which guarantees to get
    // latest entry for 'dmsl'
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl2', function () {
      this.on('dmsl2.deviceId', 'dmsl.deviceId')
        .andOn('dmsl2.day', 'dmsl.day')
        .andOn(function () {
          this.on('dmsl2.createdOn', '>', 'dmsl.createdOn')
          this.orOn(function () {
            this.on('dmsl2.createdOn', '=', 'dmsl.createdOn').andOn('dmsl2.id', '>', 'dmsl.id')
          })
        })
    })
    .leftOuterJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .whereRaw('dmsl.day >= ? AND dmsl.day < ?', [
      formatDateOrDefault(minDate, 'yyyy-MM-dd'),
      formatDateOrDefault(addDays(maxDate, 1), 'yyyy-MM-dd'),
    ])
    .whereNull('dmsl2.id') // see above description for alias `dmsl2`
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
      inactiveNoTestsPerformed: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveNoTestsPerformed'
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
      inactiveDecommissioned: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveDecommissioned'
          THEN d.id ELSE null
        END`),
      inactiveNoStaff: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveNoStaff'
          THEN d.id ELSE null
        END`),
      inactiveNoSamples: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveNoSamples'
          THEN d.id ELSE null
        END`),
      inactiveNoPower: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveNoPower'
          THEN d.id ELSE null
        END`),
      inactiveOther: knex.raw(`DISTINCT
        CASE
          WHEN dms.externalId = 'inactiveOther'
          THEN d.id ELSE null
        END`),
    })

  // update the devices counts for each day in the range

  days = days.map(day => {
    const dayCounts = allCounts.find(({ dayDate }) => format(day.date, 'yyyy-MM-dd') === format(dayDate, 'yyyy-MM-dd'))
    if (dayCounts) {
      day = {
        ...day,
        ...omit(dayCounts, ['dayDate']),
      }

      day.devicesInactive = day.devicesTotal - day.devicesActive
    } else {
      day = {
        ...day,
        devicesTotal,
      }
    }
    const excludedDays = customWorkingDaysConfig?.excludedDays?.split(',').map(d => parseInt(d) - 1) || [5, 6] // Convert MySQL dayOfWeek to JS dayOfWeek
    const dayDate = new Date(day.date.getUTCFullYear(), day.date.getUTCMonth(), day.date.getUTCDate())
    day.isWeekendOrHoliday = excludedDays.includes(dayDate.getDay())
    return day
  })

  return {
    ok: true,
    data: days,
  }
}

module.exports = activityOverTimeDashboard
