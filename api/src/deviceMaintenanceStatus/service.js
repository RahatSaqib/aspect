const groupBy = require('lodash/groupBy')
const orderBy = require('lodash/orderBy')
const omit = require('lodash/omit')
const min = require('lodash/min')
const uniq = require('lodash/uniq')
const addDays = require('date-fns/addDays')
const parseISO = require('date-fns/parseISO')
const isWeekend = require('date-fns/isWeekend')
const getISOWeek = require('date-fns/getISOWeek')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { knex } = require('../db')
const {
  getArrayOfDaysInRange,
  getDateSubstring,
  startOfDayUtc,
} = require('../shared/date')
const { allDeviceMaintenanceStatusToId } = require('../shared/dictionary')

async function deviceStatusOverTime(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  let { minDate, maxDate } = request.query
  minDate = startOfDayUtc(minDate).toISOString()
  maxDate = startOfDayUtc(min([maxDate, addDays(new Date(), 1)])).toISOString()

  const days = getArrayOfDaysInRange(minDate, maxDate)

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
        .andOn('r.endedOn', '>=', knex.raw(`'${minDate}'`))
        .andOn('r.endedOn', '<=', knex.raw(`'${maxDate}'`))
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
        .andOn('r.endedOn', '>=', knex.raw(`'${minDate}'`))
        .andOn('r.endedOn', '<=', knex.raw(`'${maxDate}'`))
    })
    .modify(addConstraints, dataConstraints, {
      result: 'r',
    })
    .whereIn('d.id', deviceIds)
    .groupBy('d.id', 'dayDate')
    .select(
      'd.id',
      knex.raw('COUNT(r.id) as totalResults'),
      knex.raw(`DATE_FORMAT(r.endedOn, '%Y-%m-%d') as dayDate`)
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
    .where('dmsl.day', '>=', minDate)
    .where('dmsl.day', '<=', maxDate)
    // Only get the devices of category types that perform tests
    .where('dtc.hasResults', 1)
    .where('dt.externalId', 'CepheidGeneXpert')
    // Only get the current device maintenance status log if the device hasn't any newer statuses the same day (Only the last status of each device and day)
    .whereNull('newerDmslOnSameDay.id')
    // Grouped by device and day
    .groupBy(['d.id', 'dmsl.day'])
    .select([
      'd.id as deviceId',
      knex.raw(`DATE_FORMAT(dmsl.day, '%Y-%m-%d') as day`),
      'dms.i18nKey as maintenanceStatusI18nKey',
      'dms.name as maintenanceStatusName',
      'dms.externalId as maintenanceStatusExternalId',
    ])
  statusData = groupListBy(statusData, 'deviceId', 'day')

  let data = []
  devices.forEach(device => {
    const maintenanceStatusHistory = []
    days.forEach(day => {
      const onlyDate = getDateSubstring(day.toISOString())
      const groupName = getGroupName(device.id, onlyDate)

      const [{ totalResults = 0 }] = devicesByDay[groupName] || [{}]

      let [status] = statusData[groupName] || [{}]
      if (status) {
        status = omit(status, 'deviceId')

        if (
          // when device has no tests on this day ...
          totalResults === 0 &&
          // ... and it's current maintenance status for the day is active ...
          ['active', 'reportedActive'].includes(
            status.maintenanceStatusExternalId
          )
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
        day: onlyDate,
        isWeekend: isWeekend(parseISO(onlyDate)),
        weekNumber: getISOWeek(parseISO(onlyDate)),
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

module.exports = {
  deviceStatusOverTime,
}
