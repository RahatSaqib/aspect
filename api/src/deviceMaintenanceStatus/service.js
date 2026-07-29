const { groupBy, orderBy, omit, min, uniq, isNil, isArray } = require('lodash')
const { format, getISOWeek, parseISO } = require('date-fns')
const { getConstraints, addConstraints, getUserFromCredentials } = require('../auth/constraints')
const { knex, filterParams } = require('../db')
const {
  getArrayOfDaysInRange,
  getDateTimeExpressionInTimeZone,
  getDateSubstring,
  isWeekend,
} = require('../shared/date')
const { allDeviceMaintenanceStatusToId } = require('../shared/dictionary')
const { getPeopleBase } = require('../shared/utilsPerson')
const { getPartnerWorkingDaysConfig } = require('../partner/common/db')

/**
 * minDate and maxDate - are LOCAL user date-time
 */
function deviceStatusByDayQuery(dataConstraints, minDate, maxDate) {
  /**
   * get formatted DATE part which corresponds with date from observer
   * point of view (on user's side).
   * --> why we need to use user's local time here instead of previous way of running
   *   startOfDayUtc(new Date(minDate))
   * is because if time is '2024-05-01 01:44:55.123+06:00' on user's side
   * then it means user wants to see data for May 1, but in ISO date is
   * '2024-04-30 19:44:55.123Z' and `startOfDayUtc` returns '2024-04-30 00:00:00.000Z'
   */
  const minDateStatus = format(new Date(minDate), 'yyyy-MM-dd')
  const maxDateStatus = format(new Date(maxDate), 'yyyy-MM-dd')

  return (
    knex('Device as d')
      .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .innerJoin('Site as s', 'd.siteId', 's.id')
      .innerJoin('Geography as g', 's.geographyId', 'g.id')
      .innerJoin('Partner as p', 'd.partnerId', 'p.id')
      .modify(addConstraints, dataConstraints, {
        partner: 'p',
        geography: 'g',
        device: 'd',
      })
      .innerJoin('DeviceMaintenanceStatusLog as dmsl', 'd.id', 'dmsl.deviceId')
      .innerJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
      .leftJoin('Person as pe', 'dmsl.createdBy', 'pe.userId')
      /**
       * Notice that for getting latest entry for the deviceId/day in DeviceMaintenanceStatusLog,
       * below we are again joining to DeviceMaintenanceStatusLog ...
       */
      .leftOuterJoin('DeviceMaintenanceStatusLog as newerDmslOnSameDay', qb => {
        /**
         * for the same `deviceId` ...
         */
        qb.on('newerDmslOnSameDay.deviceId', 'dmsl.deviceId')
          /**
           * for the same `day` ...
           */
          .andOn('newerDmslOnSameDay.day', 'dmsl.day')
          /**
           * and make sure that `createdOn` is greater than previous ...
           */
          .andOn(qb => {
            qb.on('newerDmslOnSameDay.createdOn', '>', 'dmsl.createdOn')
            /**
             * or if they are equal, then get entry with greater `id` value
             */
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
      /**
       * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
       * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
       * in `api/src/auth/constraints.js` where user permitted deviceType is used
       */
      .whereNot('dt.externalId', 'GxAlert')
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
        knex.raw("dmsl.data->>'$.notes' AS maintenanceStatusNotes"),
        knex.raw("dmsl.data->>'$.expectedBackOnline' AS expectedBackOnline")
      )
  )
}

async function deviceStatusOverTime(request) {
  const { auth, query } = request
  const data = await getDeviceStatusOverTime(auth, query)
  return { ok: true, data }
}

async function getDeviceStatusOverTime(auth, query, forDeviceIds) {
  const dataConstraints = await getConstraints(auth.credentials)
  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA } = user
  const customWorkingDaysConfig = await getPartnerWorkingDaysConfig(auth)

  /**
   * minDate and maxDate are Date object, because we used
   * Joi.date() validation in endpoints.js
   */
  const { minDate, maxDate } = query
  const minDateFormat = "yyyy-MM-dd'T'00:00:00.000'Z'"
  const maxDateFormat = "yyyy-MM-dd'T'23:59:59.999'Z'"

  const minDateResults = format(typeof minDate === 'string' ? parseISO(minDate) : minDate, minDateFormat)
  const maxDateResults = min([format(maxDate, maxDateFormat), format(new Date(), maxDateFormat)])

  const days = getArrayOfDaysInRange(minDate, maxDate)

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

  const devices = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
      site: 's',
      device: 'd',
    })
    .modify(filterParams, query, {
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .where('dtc.hasResults', 1)
    .whereNotIn('dt.externalId', ['GxAlert', 'Aspect'])
    .where(function () {
      if (forDeviceIds && isArray(forDeviceIds)) {
        this.whereIn('d.id', forDeviceIds)
      }
    })
    .groupBy('d.id')
    .select(
      'd.id',
      'd.name',
      'd.shortName',
      'd.siteId',
      's.name as siteName',
      'd.dailyTestCapacity as deviceCapacity',
      's.longitude',
      's.latitude',
      's.hoursStart',
      's.hoursEnd'
    )
  devices.forEach(device => {
    device.totalResults = 0
  })
  const deviceIds = uniq(devices.map(({ id }) => id))
  const siteIds = uniq(devices.map(({ siteId }) => siteId))

  const results = await knex('Result as r')
    .whereIn('r.deviceId', deviceIds)
    .where(getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timezoneIANA), '>=', knex.raw(`'${minDateResults}'`))
    .where(getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timezoneIANA), '<=', knex.raw(`'${maxDateResults}'`))
    .modify(addConstraints, dataConstraints, {
      result: 'r',
    })
    .groupBy('r.deviceId')
    .select('r.deviceId', knex.raw('COUNT(r.id) as totalResults'))

  results.forEach(({ deviceId, totalResults }) => {
    devices.find(d => d.id === deviceId).totalResults = totalResults
  })

  let devicesByDay = await knex('Device as d')
    .leftJoin('Result as r', joinQuery => {
      joinQuery
        .on('d.id', 'r.deviceId')
        .andOn(getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timezoneIANA), '>=', knex.raw(`'${minDateResults}'`))
        .andOn(getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timezoneIANA), '<=', knex.raw(`'${maxDateResults}'`))
    })
    .modify(addConstraints, dataConstraints, {
      result: 'r',
    })
    .whereIn('d.id', deviceIds)
    .groupBy('d.id', 'dayDate')
    .select(
      'd.id',
      knex.raw('COUNT(r.id) as totalResults'),
      /**
       * convert date from UTC onto country timezone
       */
      knex.raw(`
        DATE_FORMAT(
          CONVERT_TZ(r.endedOn, '+00:00', '${timezoneIANA}'),
          '%Y-%m-%d'
        ) as dayDate
      `)
    )
  devicesByDay = groupListBy(devicesByDay, 'id', 'dayDate')

  let statusData = await knex
    .from(deviceStatusByDayQuery(dataConstraints, minDate, maxDate).as('deviceStatusByDay'))
    .select(
      'deviceStatusByDay.deviceId',
      /**
       * Notice that `DeviceMaintenanceStatusLog.day` is stored in a field of `Date` datatype,
       * so it doesn't have time, and is assumed as date as-is.
       * So, below we don't need to convert/transform it to user's timezone,
       * because we need exact day (i.e. 2022-06-01, but not 2022-05-31 in case when we apply TZ)
       */
      knex.raw(`DATE_FORMAT(deviceStatusByDay.day, '%Y-%m-%d') as day`),
      'deviceStatusByDay.maintenanceStatusI18nKey',
      'deviceStatusByDay.maintenanceStatusName',
      'deviceStatusByDay.maintenanceStatusExternalId',
      'deviceStatusByDay.maintenanceStatusManuallySetById',
      'deviceStatusByDay.maintenanceStatusManuallySetByName',
      'deviceStatusByDay.maintenanceStatusManuallySetByDate',
      'deviceStatusByDay.maintenanceStatusNotes',
      'deviceStatusByDay.expectedBackOnline'
    )
  statusData = groupListBy(statusData, 'deviceId', 'day')

  /**
   * get persons for all related sites
   */
  const persons = await getPeopleBase()
    .leftJoin('Geography as jcg', 'jc.geographyId', 'jcg.id')
    .modify(addConstraints, dataConstraints, { geography: 'g', site: 's' })
    .whereIn('s.id', siteIds)
    .orderBy('p.name')
    .groupBy('p.id')
    .select(
      'p.id as personId',
      'p.name',
      'p.email',
      'p.phone',
      'p.cell',
      'p.disabled',
      'p.disabledOn',
      's.id as siteId'
    )

  /**
   * define `data` to return
   */
  let data = []
  devices.forEach(device => {
    const maintenanceStatusHistory = []
    days.forEach(day => {
      // get only date part of the date to match `day` field in results, as well as key in groupListBy
      const isoDay = getDateSubstring(day.toISOString())
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

      const dayDate = new Date(isoDay)
      maintenanceStatusHistory.push({
        ...status,
        day: isoDay,
        isWeekend: isWeekend(dayDate, customWorkingDaysConfig),
        weekNumber: getISOWeek(dayDate),
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

    const siteContacts = persons
      .filter(({ siteId }) => device.siteId === siteId)
      .map(({ personId, name, email, phone, cell, disabled, disabledOn }) => ({
        personId,
        name,
        email,
        phone: uniq([phone, cell].filter(it => !!it)),
        disabled: disabled === 1,
        disabledOn,
      }))

    data.push({
      ...device,
      maintenanceStatusHistory,
      siteContacts,
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
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
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
