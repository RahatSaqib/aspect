const groupBy = require('lodash/groupBy')
const orderBy = require('lodash/orderBy')
const omit = require('lodash/omit')
const min = require('lodash/min')
const uniq = require('lodash/uniq')
const isNil = require('lodash/isNil')
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

function deviceStatusByDayQuery(dataConstraints, minDate, maxDate) {
  const minDateStatus = startOfDayUtc(new Date(minDate))
  const maxDateStatus = startOfDayUtc(new Date(maxDate))
  return (
    knex('Device as d')
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
      .innerJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
      .leftJoin('Person as pe', 'dmsl.createdBy', 'pe.userId')
      .leftOuterJoin('DeviceMaintenanceStatusLog as newerDmslOnSameDay', qb => {
        qb.on('newerDmslOnSameDay.deviceId', 'dmsl.deviceId')
          .andOn('newerDmslOnSameDay.day', 'dmsl.day')
          .andOn(qb => {
            qb.on('newerDmslOnSameDay.createdOn', '>', 'dmsl.createdOn')
            qb.orOn(qb => {
              qb.on('newerDmslOnSameDay.createdOn', '=', 'dmsl.createdOn').andOn(
                'newerDmslOnSameDay.id',
                '>',
                'dmsl.id'
              )
            })
          })
      })
      .where('dmsl.day', '>=', minDateStatus)
      .where('dmsl.day', '<=', maxDateStatus)
      // Only get the devices of category types that perform tests
      .where('dtc.hasResults', 1)
      .where('dt.externalId', 'CepheidGeneXpert')
      // Only get the current device maintenance status log if the device hasn't any newer statuses the same day
      // (Only the last status of each device and day)
      .whereNull('newerDmslOnSameDay.id')
      // Grouped by device and day
      .groupBy(['d.id', 'dmsl.day'])
      .select(
        'd.id as deviceId',
        'd.name',
        'd.shortName',
        'dmsl.day',
        'dms.i18nKey as maintenanceStatusI18nKey',
        'dms.name as maintenanceStatusName',
        'dms.externalId as maintenanceStatusExternalId',
        'dms.active as maintenanceStatusIsActive',
        'pe.id as maintenanceStatusManuallySetById',
        'pe.name as maintenanceStatusManuallySetByName',
        'dmsl.createdOn as maintenanceStatusManuallySetByDate',
        knex.raw("dmsl.data->>'$.notes' AS maintenanceStatusNotes")
      )
  )
}

async function deviceStatusOverTime(request) {
  const { auth, query } = request
  const data = await getDeviceStatusOverTime(auth, query)
  return { ok: true, data }
}

async function getDeviceStatusOverTime(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate, maxDate } = query
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
    groupBy(items, item => getGroupName(item[deviceIdPropName], item[datePropName]))
  const inactiveUnknown = await knex('DeviceMaintenanceStatus')
    .where('id', deviceMaintenanceStatuses.inactiveUnknown)
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
    .leftJoin('DeviceCapacity as dcap', 'd.deviceCapacityId', 'dcap.id')
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
      'dcap.dailyCapacity as deviceCapacity',
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

  let statusData = await knex
    .from(deviceStatusByDayQuery(dataConstraints, minDate, maxDate).as('deviceStatusByDay'))
    .select(
      'deviceStatusByDay.deviceId',
      // We are going to return the dates grouped by the user's timezone, and as the days are stored as only date,
      // then we will just transform (not convert!!!) those dates to the given offset
      knex.raw(`CONCAT(DATE_FORMAT(deviceStatusByDay.day, '%Y-%m-%dT'), '00:00:00.000', '${offset}') as day`),
      'deviceStatusByDay.maintenanceStatusI18nKey',
      'deviceStatusByDay.maintenanceStatusName',
      'deviceStatusByDay.maintenanceStatusExternalId',
      'deviceStatusByDay.maintenanceStatusManuallySetById',
      'deviceStatusByDay.maintenanceStatusManuallySetByName',
      'deviceStatusByDay.maintenanceStatusManuallySetByDate',
      'deviceStatusByDay.maintenanceStatusNotes'
    )
  statusData = groupListBy(statusData, 'deviceId', 'day')

  let data = []
  devices.forEach(device => {
    const maintenanceStatusHistory = []
    days.forEach(day => {
      // We need to transform the days to the user's offset for matching with the query results
      const isoDay = `${getDateSubstring(day.toISOString())}T00:00:00.000${offset}`

      const groupName = getGroupName(device.id, isoDay)

      const [{ totalResults = 0 }] = devicesByDay[groupName] || [{}]

      let [status] = statusData[groupName] || [{}]
      if (status) {
        if (!isNil(status.maintenanceStatusManuallySetById) && !isNil(status.maintenanceStatusManuallySetByDate)) {
          try {
            status.maintenanceStatusManuallySetBy = {
              id: status.maintenanceStatusManuallySetById,
              name: status.maintenanceStatusManuallySetByName,
              updatedDate: status.maintenanceStatusManuallySetByDate,
            }
          } catch (error) {
            throw new Error(error)
          }
        } else {
          status.maintenanceStatusManuallySetBy = {}
        }

        status = omit(status, [
          'deviceId',
          'maintenanceStatusManuallySetById',
          'maintenanceStatusManuallySetByName',
          'maintenanceStatusManuallySetByDate',
        ])

        if (
          // when device has no tests on this day ...
          totalResults === 0 &&
          // ... and it's current maintenance status for the day is active ...
          status.maintenanceStatusExternalId === 'active'
        ) {
          // ... then change it's status to 'Unknown' for this day
          status = {
            ...status,
            ...inactiveUnknown,
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

    /**
     * calculate number of days with same status
     */
    let prevExternalId
    let indicesInSameStatus = []
    // helper func
    const setDaysInSameStatus = indices =>
      indices.forEach(index => {
        maintenanceStatusHistory[index].daysInSameStatus = indices.length
      })
    // process all days of current device
    maintenanceStatusHistory.forEach(({ isWeekend, maintenanceStatusExternalId }, index) => {
      if (isWeekend && maintenanceStatusExternalId !== 'active') {
        return
      }
      /**
       * process day that is either a working day OR is weekend but status is Active (see above condition)
       */
      if (prevExternalId !== maintenanceStatusExternalId) {
        // status changed - process previous days with same status
        setDaysInSameStatus(indicesInSameStatus)
        // set new status and init array with indices
        prevExternalId = maintenanceStatusExternalId
        indicesInSameStatus = [index]
      } else {
        // same status - add index of current day
        indicesInSameStatus = [...indicesInSameStatus, index]
      }
    })
    // process remaining days with same status
    setDaysInSameStatus(indicesInSameStatus)

    data.push({
      ...device,
      maintenanceStatusHistory,
    })
  })
  data = orderBy(data, ['name'])

  return data
}

/**
 * Gets a collection of devices and their latest reported maintenance status.
 * @param {*} request The REST request object
 * @returns A collection of devices, including data of the latest logged maintenance status.
 */
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
    // Join with DMSL only if it's not on weekend, unless it was reported something different than inactiveNoTestsPerformed or inactiveUnknown
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmslInner', dmslJoin => {
      dmslJoin.on('d.id', 'dmslInner.deviceId').andOn(builder => {
        builder
          .on(
            knex.raw(`
              (
                DAYOFWEEK(dmslInner.day) != 7
                AND
                DAYOFWEEK(dmslInner.day) != 1
              )
            `)
          )
          .orOn(
            knex.raw(`
              (
                dmslInner.deviceMaintenanceStatusId != ${deviceMaintenanceStatuses.inactiveNoTestsPerformed}
                AND
                dmslInner.deviceMaintenanceStatusId != ${deviceMaintenanceStatuses.inactiveUnknown}
              )
            `)
          )
      })
    })
    .groupBy('d.id')
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
      knex.raw('MAX(dmslInner.day) as lastReportedOn'),
    ])
    .as('devices')

  // for each device, get the last status log data from the last reported day
  const data = await knex(devices)
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl', joinDmsl => {
      joinDmsl.on('devices.deviceId', 'dmsl.deviceId').andOn('devices.lastReportedOn', 'dmsl.day')
    })
    // Join for checking if the current device maintenance status log ('dmsl') is the last of the last reported day
    .leftOuterJoin('DeviceMaintenanceStatusLog as newerDmslOnSameDay', function () {
      this.on('newerDmslOnSameDay.deviceId', 'dmsl.deviceId')
        .andOn('newerDmslOnSameDay.day', 'dmsl.day')
        .andOn(function () {
          this.on('newerDmslOnSameDay.createdOn', '>', 'dmsl.createdOn')
          this.orOn(function () {
            this.on('newerDmslOnSameDay.createdOn', '=', 'dmsl.createdOn').andOn(
              'newerDmslOnSameDay.id',
              '>',
              'dmsl.id'
            )
          })
        })
    })
    .leftOuterJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
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
      knex.raw(`IFNULL(dms.i18nKey, '${inactiveUnknown.i18nKey}') as maintenanceStatusI18nKey`),
      knex.raw(`IFNULL(dms.name, '${inactiveUnknown.name}') as maintenanceStatusName`),
      knex.raw(`IFNULL(dms.externalId, '${inactiveUnknown.externalId}') as maintenanceStatusExternalId`),
    ])
    .orderBy('devices.name')

  return { ok: true, data }
}

module.exports = {
  deviceStatusOverTime,
  getDeviceStatusOverTime,
  deviceStatusLastReported,
  deviceStatusByDayQuery,
}
