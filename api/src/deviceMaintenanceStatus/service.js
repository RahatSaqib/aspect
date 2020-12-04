const groupBy = require('lodash/groupBy')
const orderBy = require('lodash/orderBy')
const omit = require('lodash/omit')
const min = require('lodash/min')
const addDays = require('date-fns/addDays')
const parseISO = require('date-fns/parseISO')
const format = require('date-fns/format')
const isWeekend = require('date-fns/isWeekend')
const getISOWeek = require('date-fns/getISOWeek')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { knex } = require('../db')
const { getArrayOfDaysInRange, getDateSubstring, startOfDayUtc } = require('../shared/date')
const { formatDate } = require('../stringTemplate/service')


async function deviceStatusOverTime(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  let { minDate, maxDate } = request.query
  minDate = startOfDayUtc(minDate).toISOString()
  maxDate = startOfDayUtc(min([maxDate, addDays(new Date(), 1)])).toISOString()

  const days = getArrayOfDaysInRange(
    minDate,
    maxDate
  )

  const deviceData = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Result as r', query => {
      query
        .on('d.id', 'r.deviceId')
        .andOn('r.endedOn', '>=', knex.raw(`'${minDate}'`))
        .andOn('r.endedOn', '<=', knex.raw(`'${maxDate}'`))
    })
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
      result: 'r',
      site: 's',
    })
    .where('dtc.hasResults', 1)
    .groupBy('d.id')
    .orderBy('d.name')
    .select([
      'd.id',
      'd.name',
      's.longitude',
      's.latitude',
      knex.raw('COUNT(r.id) as totalResults'),
    ])

  const lastDayStatuses = knex(`DeviceMaintenanceStatusLog as dmsl`)
    .leftJoin('DeviceMaintenanceStatusLog as dmsl2', join => {
      join.on('dmsl.deviceId', 'dmsl2.deviceId')
        .andOn('dmsl.day', 'dmsl2.day')
        .andOn(and => {
          and.andOn('dmsl.createdOn', '<', 'dmsl2.day')
            .orOn(or => {
              or.andOn('dmsl.createdOn', '=', 'dmsl2.id')
                .andOn('dmsl.id', '<', 'dmsl2.id')
            })
        })
    })
    .whereNull('dmsl2.id')
    .groupBy([`dmsl.deviceId`, `dmsl.day`, 'dmsl.deviceMaintenanceStatusId'])
    .select(['dmsl.deviceId', 'dmsl.day', 'dmsl.deviceMaintenanceStatusId'])
    .as('lastDayStatus')

  let statusData = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
    })
    .innerJoin(
      'DeviceMaintenanceStatusLog as dmsl',
      'd.id',
      'dmsl.deviceId'
    )
    .innerJoin(
      'DeviceMaintenanceStatus as dms',
      'dmsl.deviceMaintenanceStatusId',
      'dms.id'
    )
    // Join for checking if the current device maintenance status log is the last of the day
    .leftJoin('DeviceMaintenanceStatusLog as dmsl2', join => {
      join.on('dmsl.deviceId', 'dmsl2.deviceId')
        .andOn('dmsl.day', 'dmsl2.day')
        .andOn(and => {
          and.andOn('dmsl.createdOn', '<', 'dmsl2.day')
            .orOn(or => {
              or.andOn('dmsl.createdOn', '=', 'dmsl2.id')
                .andOn('dmsl.id', '<', 'dmsl2.id')
            })
        })
    })
    // Join for getting the last different status before the current one, so then we can calculate the number of days in the same status
    .leftJoin(lastDayStatuses, query => {
      query
        .on('dmsl.deviceId', 'lastDayStatus.deviceId')
        .andOn('dmsl.day', '>=', 'lastDayStatus.day')
        .andOn(
          'dms.id',
          '!=',
          'lastDayStatus.deviceMaintenanceStatusId'
        )
    })
    // Where maintenance status log is in range
    .where('dmsl.day', '>=', minDate)
    .where('dmsl.day', '<=', maxDate)
    // Only get the devices of category types that perform tests
    .where('dtc.hasResults', 1)
    // Only get the current device maintenance status log if the device hasn't any newer statuses the same day (Only the last status of each device and day)
    .whereNull('dmsl2.id')
    // Grouped by device and day
    .groupBy([
      'd.id',
      'dmsl.day',
      'dms.i18nKey',
      'dms.name',
      'dms.externalId',
      'dms.id',
    ])
    .select([
      'd.id as deviceId',
      'dmsl.day',
      'dms.i18nKey as maintenanceStatusI18nKey',
      'dms.name as maintenanceStatusName',
      'dms.externalId as maintenanceStatusExternalId',
      knex.raw(
        'IFNULL(DATEDIFF(dmsl.day, MAX(lastDayStatus.day)), 1) as daysInSameStatus'
      ),
    ])

  statusData = groupBy(
    statusData,
    statusDataItem =>
      statusDataItem.deviceId + getDateSubstring(statusDataItem.day.toISOString())
  )

  let data = []
  deviceData.forEach(device => {
    const maintenanceStatusHistory = []

    days.forEach(day => {
      const onlyDate = getDateSubstring(day.toISOString())

      let status = {}
      if (statusData[device.id + onlyDate])
        [status] = statusData[device.id + onlyDate]

      maintenanceStatusHistory.push({
        ...omit(status, 'deviceId'),
        day: onlyDate,
        isWeekend: isWeekend(parseISO(onlyDate)),
        weekNumber: getISOWeek(parseISO(onlyDate)),
      })
    })
    data = orderBy(data, ['name'])

    data.push({
      ...device,
      maintenanceStatusHistory,
    })
  })

  return { ok: true, data }
}

module.exports = {
  deviceStatusOverTime,
}
