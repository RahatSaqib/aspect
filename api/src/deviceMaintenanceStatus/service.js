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

  const lastDayStatusesIds = knex('DeviceMaintenanceStatusLog as dmsl2')
    .where('dmsl2.day', '>=', minDate)
    .where('dmsl2.day', '<=', maxDate)
    .groupBy(['dmsl2.deviceId', 'dmsl2.day'])
    .select(knex.raw('MAX(dmsl2.id)'))
    .as('lastDayStatusesIds')

  const lastDayStatuses = knex(`DeviceMaintenanceStatusLog as dmsl`)
    .leftJoin('DeviceMaintenanceStatusLog as dmsl2', q => {
      q.on('dmsl.deviceId', 'dmsl2.deviceId')
        .andOn('dmsl.day', 'dmsl2.day')
        .andOn(q2 => {
          q2.andOn('dmsl.createdOn', '<', 'dmsl2.day')
            .orOn(q3 => {
              q3.andOn('dmsl.createdOn', '=', 'dmsl2.id')
                .andOn('dmsl.id', '<', 'dmsl2.id')
            })
        })
    })
    .whereNull('dmsl2.id')
    .groupBy([`dmsl.deviceId`, `dmsl.day`, 'dmsl.deviceMaintenanceStatusId'])
    .select(['dmsl.deviceId', 'dmsl.day', 'dmsl.deviceMaintenanceStatusId'])
    .as('lastDayStatus')

  let statusData = await knex
    // all devices
    .from(
      knex('Device as d')
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
        // Only the statuses in range
        .where(q => {
          q.where('dmsl.day', '>=', minDate)
          q.where('dmsl.day', '<=', maxDate)
          // Only the last status of each device and day
          q.whereIn('dmsl.id', knex.from(lastDayStatusesIds))
          q.where('dtc.hasResults', 1)
        })
        .groupBy([
          'd.id',
          'dmsl.createdOn',
          'dmsl.day',
          'dms.i18nKey',
          'dms.name',
          'dms.externalId',
        ])
        .orderBy(['d.name', 'dmsl.day'])
        .select([
          'd.id as deviceId',
          'dmsl.day',
          'dms.i18nKey as maintenanceStatusI18nKey',
          'dms.name as maintenanceStatusName',
          'dms.externalId as maintenanceStatusExternalId',
          'dms.id as maintenanceStatusId',
        ])
        .as('q')
    )
    // for each device and day, join the last log when the status was previous and different than the current one
    .leftJoin(lastDayStatuses, query => {
      query
        .on('q.deviceId', 'lastDayStatus.deviceId')
        .andOn('q.day', '>=', 'lastDayStatus.day')
        .andOn(
          'q.maintenanceStatusId',
          '!=',
          'lastDayStatus.deviceMaintenanceStatusId'
        )
    })
    .groupBy([
      'q.deviceId',
      'q.day',
      'q.maintenanceStatusI18nKey',
      'q.maintenanceStatusName',
      'q.maintenanceStatusExternalId',
      'q.maintenanceStatusId',
    ])
    .select([
      'q.deviceId',
      'q.day',
      'q.maintenanceStatusI18nKey',
      'q.maintenanceStatusName',
      'q.maintenanceStatusExternalId',
      knex.raw(
        'IFNULL(DATEDIFF(q.day, MAX(lastDayStatus.day)), 1) as daysInSameStatus'
      ),
    ])



  statusData = groupBy(
    statusData,
    statusDataItem =>
      statusDataItem.deviceId + getDateSubstring(statusDataItem.day.toISOString())
  )

  let data = []

  console.log('day', days[0])
  console.log(days[0].toISOString())
  console.log('formatted', format(days[0], 'yyyy-MM-dd'))
  console.log('formatted 2', getDateSubstring(days[0].toISOString()))

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
