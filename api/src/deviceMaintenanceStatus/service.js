const groupBy = require('lodash/groupBy')
const orderBy = require('lodash/orderBy')
const omit = require('lodash/omit')
const min = require('lodash/min')
const uniq = require('lodash/uniq')
const isWeekend = require('date-fns/isWeekend')
const getISOWeek = require('date-fns/getISOWeek')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { knex } = require('../db')
const {
  getArrayOfDaysInRange,
  getOffsetFromIsoDateString,
  startOfDayUtc,
  getDateSubstring,
  getISODateUserTimeZoneField,
} = require('../shared/date')
const { allDeviceMaintenanceStatusToId } = require('../shared/dictionary')

async function deviceStatusOverTime(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate, maxDate } = request.query
  const offset = getOffsetFromIsoDateString(minDate)
  // Filters for results: results should be filtered normally, just converting the received date to UTC
  const minDateResults = new Date(minDate).toISOString()
  const maxDateResults = min([new Date(maxDate), new Date()]).toISOString()

  // Filters for statuses: statuses should be filtered differently, as they are saved as only date.
  // If a date time like '2020-01-01T00:00:00.000-03:00' is received, then we should convert it to '2020-01-01T00:00:00.000Z' (same date, same day, but in Z timezone)
  const minDateStatus = startOfDayUtc(new Date(minDate))
  const maxDateStatus = startOfDayUtc(new Date(maxDate))

  const days = getArrayOfDaysInRange(minDateStatus, maxDateStatus)

  // helpers
  const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
  const getGroupName = (deviceId, day) => `${deviceId}-${day}`
  const groupListBy = (items, deviceIdPropName, datePropName) =>
    groupBy(items, item =>
      getGroupName(item[deviceIdPropName], item[datePropName])
    )
  const inactiveNoResultsReported = await knex('DeviceMaintenanceStatus')
    .where('id', deviceMaintenanceStatuses.inactiveNoResultsReported)
    .select(
      'name as maintenanceStatusName',
      'i18nKey as maintenanceStatusI18nKey',
      'externalId as maintenanceStatusExternalId'
    )
    .first()
  // generic query for devices grouped by id with counts of tests
  const devices = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Result as r', joinQuery => {
      joinQuery
        .on('d.id', 'r.deviceId')
        .andOn('r.endedOn', '>=', knex.raw(`'${minDateResults}'`))
        .andOn('r.endedOn', '<=', knex.raw(`'${maxDateResults}'`))
    })
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
      result: 'r',
      site: 's',
      device: 'd',
    })
    .where('dtc.hasResults', 1)
    .where('dt.externalId', 'CepheidGeneXpert')
    .groupBy('d.id')
    .select(
      'd.id',
      'd.name',
      'd.shortName',
      's.longitude',
      's.latitude',
      knex.raw('COUNT(r.id) as totalResults')
    )

  const deviceIds = uniq(devices.map(({ id }) => id))

  let devicesByDay = await knex('Device as d')
    .leftJoin('Result as r', joinQuery => {
      joinQuery
        .on('d.id', 'r.deviceId')
        .andOn('r.endedOn', '>=', knex.raw(`'${minDateResults}'`))
        .andOn('r.endedOn', '<=', knex.raw(`'${maxDateResults}'`))
    })
    .modify(addConstraints, dataConstraints, {
      result: 'r',
    })
    .whereIn('d.id', deviceIds)
    .groupBy('d.id', 'dayDate')
    .select(
      'd.id',
      knex.raw('COUNT(r.id) as totalResults'),
      getISODateUserTimeZoneField(knex, 'r.endedOn', 'dayDate', offset)
    )
  devicesByDay = groupListBy(devicesByDay, 'id', 'dayDate')

  // maintenance statuses grouped by device id and day
  let statusData = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
      device: 'd',
    })
    .innerJoin('DeviceMaintenanceStatusLog as dmsl', 'd.id', 'dmsl.deviceId')
    .innerJoin(
      'DeviceMaintenanceStatus as dms',
      'dmsl.deviceMaintenanceStatusId',
      'dms.id'
    )
    // Join for checking if the current device maintenance status log ('dmsl') is the last of the day
    .leftOuterJoin(
      'DeviceMaintenanceStatusLog as newerDmslOnSameDay',
      function () {
        this.on('newerDmslOnSameDay.deviceId', 'dmsl.deviceId')
          .andOn('newerDmslOnSameDay.day', 'dmsl.day')
          .andOn(function () {
            this.on('newerDmslOnSameDay.createdOn', '>', 'dmsl.createdOn')
            this.orOn(function () {
              this.on(
                'newerDmslOnSameDay.createdOn',
                '=',
                'dmsl.createdOn'
              ).andOn('newerDmslOnSameDay.id', '>', 'dmsl.id')
            })
          })
      }
    )
    // Where maintenance status log is in range
    .where('dmsl.day', '>=', minDateStatus)
    .where('dmsl.day', '<=', maxDateStatus)
    // Only get the devices of category types that perform tests
    .where('dtc.hasResults', 1)
    .where('dt.externalId', 'CepheidGeneXpert')
    // Only get the current device maintenance status log if the device hasn't any newer statuses the same day (Only the last status of each device and day)
    .whereNull('newerDmslOnSameDay.id')
    // Grouped by device and day
    .groupBy(['d.id', 'dmsl.day'])
    .select([
      'd.id as deviceId',
      // We are going to return the dates grouped by the user's timezone, and as the days are stored as only date, then we will just transform (not convert!!!) those dates to the given offset
      knex.raw(
        `CONCAT(DATE_FORMAT(dmsl.day, '%Y-%m-%dT'), '00:00:00.000', '${offset}') as day`
      ),
      'dms.i18nKey as maintenanceStatusI18nKey',
      'dms.name as maintenanceStatusName',
      'dms.externalId as maintenanceStatusExternalId',
    ])
  statusData = groupListBy(statusData, 'deviceId', 'day')

  let data = []
  devices.forEach(device => {
    const maintenanceStatusHistory = []
    days.forEach(day => {
      // We need to transform the days to the user's offset for matching with the query results
      const isoDay = `${getDateSubstring(
        day.toISOString()
      )}T00:00:00.000${offset}`
      const groupName = getGroupName(device.id, isoDay)

      const [{ totalResults = 0 }] = devicesByDay[groupName] || [{}]

      let [status] = statusData[groupName] || [{}]
      if (status) {
        status = omit(status, 'deviceId')

        if (
          // when device has no tests on this day ...
          totalResults === 0 &&
          // ... and it's current maintenance status for the day is active ...
          status.maintenanceStatusExternalId === 'active'
        ) {
          // ... then change it's status to 'No Results Reported' for this day
          status = {
            ...status,
            ...inactiveNoResultsReported,
          }
        }
      }

      maintenanceStatusHistory.push({
        ...status,
        day: isoDay,
        isWeekend: isWeekend(new Date(isoDay)),
        weekNumber: getISOWeek(new Date(isoDay)),
        totalResults,
      })
    })

    data.push({
      ...device,
      maintenanceStatusHistory,
    })
  })
  data = orderBy(data, ['name'])

  return { ok: true, data }
}

async function deviceStatusLastReported(request) {
  const { auth, query } = request
  const { excludeNotLocalizableDevices } = query
  const dataConstraints = await getConstraints(auth.credentials)

  const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
  const inactiveUnknown = await knex('DeviceMaintenanceStatus')
    .where('id', deviceMaintenanceStatuses.inactiveUnknown)
    .first()

  // get all scoped devices and their last reported day
  const devices = knex('Device as d')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
      site: 's',
      device: 'd',
    })
    // Join with DMSL only if it's not on weekend, unless it was reported something different than NO RESULT or UNKNOWN
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl', dmslJoin => {
      dmslJoin
        .on('d.id', 'dmsl.deviceId')
        .andOn(
          knex.raw('DAYOFWEEK(dmsl.day) != 7 AND DAYOFWEEK(dmsl.day) != 1')
        )
        .orOn(w => {
          w.on(
            knex.raw(
              `dmsl.deviceMaintenanceStatusId != ${deviceMaintenanceStatuses.inactiveNoResultsReported}`
            )
          )
          w.andOn(
            knex.raw(
              `dmsl.deviceMaintenanceStatusId != ${deviceMaintenanceStatuses.inactiveUnknown}`
            )
          )
        })
    })
    .groupBy('d.id', 's.id')
    // Only get the devices of category types that perform tests
    .where('dtc.hasResults', 1)
    .where('dt.externalId', 'CepheidGeneXpert')
    .modify(query => {
      if (excludeNotLocalizableDevices) {
        query.whereNotNull('s.longitude').whereNotNull('s.latitude')
      }
    })
    .select([
      'd.id as deviceId',
      'd.name',
      'd.shortName',
      's.longitude',
      's.latitude',
      knex.raw('MAX(dmsl.day) as lastReportedOn'),
    ])
    .as('devices')

  // for each device, get the last status log data from the last reported day
  const data = await knex(devices)
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl', joinDmsl => {
      joinDmsl
        .on('devices.deviceId', 'dmsl.deviceId')
        .andOn('devices.lastReportedOn', 'dmsl.day')
    })
    // Join for checking if the current device maintenance status log ('dmsl') is the last of the last reported day
    .leftOuterJoin(
      'DeviceMaintenanceStatusLog as newerDmslOnSameDay',
      function () {
        this.on('newerDmslOnSameDay.deviceId', 'dmsl.deviceId')
          .andOn('newerDmslOnSameDay.day', 'dmsl.day')
          .andOn(function () {
            this.on('newerDmslOnSameDay.createdOn', '>', 'dmsl.createdOn')
            this.orOn(function () {
              this.on(
                'newerDmslOnSameDay.createdOn',
                '=',
                'dmsl.createdOn'
              ).andOn('newerDmslOnSameDay.id', '>', 'dmsl.id')
            })
          })
      }
    )
    .leftOuterJoin(
      'DeviceMaintenanceStatus as dms',
      'dmsl.deviceMaintenanceStatusId',
      'dms.id'
    )
    // Only get the current device maintenance status log if the device hasn't any newer statuses the same day (Only the last status of each device and day)
    .whereNull('newerDmslOnSameDay.id')
    // Grouped by device
    .groupBy('devices.deviceId')
    .select([
      'devices.deviceId as id',
      'devices.name',
      'devices.shortName',
      'devices.longitude',
      'devices.latitude',
      knex.raw(
        `IFNULL(dms.i18nKey, '${inactiveUnknown.i18nKey}') as maintenanceStatusI18nKey`
      ),
      knex.raw(
        `IFNULL(dms.name, '${inactiveUnknown.name}') as maintenanceStatusName`
      ),
      knex.raw(
        `IFNULL(dms.externalId, '${inactiveUnknown.externalId}') as maintenanceStatusExternalId`
      ),
    ])
    .orderBy('devices.name')

  return { ok: true, data }
}

module.exports = {
  deviceStatusOverTime,
  deviceStatusLastReported,
}
