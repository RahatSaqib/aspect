const groupBy = require('lodash/groupBy')
const omit = require('lodash/omit')
const min = require('lodash/min')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const addDays = require('date-fns/addDays')
const parseISO = require('date-fns/parseISO')
const formatISO = require('date-fns/formatISO')
const isWeekend = require('date-fns/isWeekend')
const getISOWeek = require('date-fns/getISOWeek')
const { getArrayOfDaysInRange, formatDateOrDefault } = require('../shared/date')

async function deviceStatusOverTime(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate, maxDate } = request.query

  let days = getArrayOfDaysInRange(
    minDate,
    min([maxDate, addDays(new Date(), -1)])
  )

  const deviceData = await knex('Device as d')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Result as r', query => {
        query.on('d.id', 'r.deviceId')
          .andOn('r.endedOn', '>=', knex.raw(`'${formatISO(minDate)}'`))
          .andOn('r.endedOn', '<', knex.raw(`'${formatISO(maxDate)}'`))
      }
    )
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
      knex.raw('COUNT(r.id) as totalResults')
    ])

  console.log(deviceData)

  const groupFunc = statusDataItem => statusDataItem.deviceId + formatDateOrDefault(statusDataItem.day)

  const statusData = groupBy(
    await knex('Device as d')
      .innerJoin('Geography as g', 'd.geographyId', 'g.id')
      .innerJoin('Partner as p', 'd.partnerId', 'p.id')
      .modify(addConstraints, dataConstraints, {
        partner: 'p',
        geography: 'g',
      })
      .innerJoin('DeviceMaintenanceStatusLog as dmsl', 'd.id', 'dmsl.deviceId')
      .innerJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
      // Only the statuses in range
      .where('dmsl.day', '>=', minDate)
      .where('dmsl.day', '<', addDays(maxDate, 1))
      // Only the last status of each device and day
      .whereIn(
        'dmsl.id',
        knex('DeviceMaintenanceStatusLog')
          .where('dmsl.day', '>=', minDate)
          .where('dmsl.day', '<', addDays(maxDate, 1))
          .groupBy(['deviceId', 'day'])
          .select(knex.raw('MAX(id)'))
      )
      .groupBy(['d.id', 'dmsl.createdOn', 'dmsl.day', 'dms.i18nKey', 'dms.name', 'dms.externalId'])
      .orderBy(['d.name', 'dmsl.day'])
      .select(['d.id as deviceId', 'dmsl.day', 'dms.i18nKey', 'dms.name', 'dms.externalId'])
    , groupFunc
  )

  let data = []
  deviceData.forEach(device => {
    let maintenanceStatusHistory = []

    days.forEach(day => {
      const onlyDate = formatDateOrDefault(day)

      let status = {}
      if (statusData[device.id + onlyDate])
        status = statusData[device.id + onlyDate][0]

      maintenanceStatusHistory.push({
        day: onlyDate,
        isWeekend: isWeekend(parseISO(onlyDate)),
        weekNumber: getISOWeek(parseISO(onlyDate)),
        ...omit(status, 'deviceId'),
      })
    })

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
