const groupBy = require('lodash/groupBy')
const orderBy = require('lodash/orderBy')
const omit = require('lodash/omit')
const min = require('lodash/min')
const addDays = require('date-fns/addDays')
const parseISO = require('date-fns/parseISO')
const formatISO = require('date-fns/formatISO')
const isWeekend = require('date-fns/isWeekend')
const getISOWeek = require('date-fns/getISOWeek')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { knex } = require('../db')
const { getArrayOfDaysInRange, formatDateOrDefault } = require('../shared/date')
const { formatDate } = require('../stringTemplate/service')

async function deviceStatusOverTime(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate, maxDate } = request.query

  const days = getArrayOfDaysInRange(
    minDate,
    min([maxDate, addDays(new Date(), -1)])
  )

  const deviceData = await knex('Device as d')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Result as r', query => {
      query
        .on('d.id', 'r.deviceId')
        .andOn('r.endedOn', '>=', knex.raw(`'${formatISO(minDate)}'`))
        .andOn('r.endedOn', '<', knex.raw(`'${formatISO(maxDate)}'`))
    })
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
      result: 'r',
      site: 's',
    })
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
    .where('dmsl2.day', '<', addDays(maxDate, 1))
    .groupBy(['dmsl2.deviceId', 'dmsl2.day'])
    .select(knex.raw('MAX(dmsl2.id)'))
    .as('lastDayStatusesIds')

  const lastDayStatuses = knex(`DeviceMaintenanceStatusLog`)
    .whereIn('id', knex.from(lastDayStatusesIds))
    .groupBy([`deviceId`, `day`])
    .select(['deviceId', 'day', 'deviceMaintenanceStatusId'])
    .as('lastDayStatus')

  let statusData = await knex
    // all devices
    .from(
      knex('Device as d')
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
          q.where('dmsl.day', '<', addDays(maxDate, 1))
          // Only the last status of each device and day
          q.whereIn('dmsl.id', knex.from(lastDayStatusesIds))
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
      statusDataItem.deviceId + formatDate(statusDataItem.day)
  )

  let data = []
  deviceData.forEach(device => {
    const maintenanceStatusHistory = []

    days.forEach(day => {
      const onlyDate = formatDateOrDefault(day)

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
