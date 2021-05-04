const _ = require('lodash')
const { format, parseISO, addMonths, differenceInMonths } = require('date-fns')
const locales = require('date-fns/locale')
const { getDeviceBaseQuery } = require('../device/service')
const { deviceStatusByDayQuery } = require('./service')
const { knex, sortPageParams } = require('../db')
const { getConstraints } = require('../auth/constraints')
const {
  getMonthYearUserTimeZoneField,
  getOffsetFromIsoDateString,
} = require('../shared/date')
const { getUser } = require('../auth/service')

async function getDeviceActivityPercentReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getUser(auth.credentials.name)
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)
  const { minDate = addMonths(new Date(), -12), maxDate = new Date() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

  // get rows
  const getItems = deviceQuery
    .clone()
    .join('Result as r', 'd.id', 'r.deviceId')
    .leftJoin(
      'DeviceMaintenanceStatusLog as dmsl',
      'd.deviceMaintenanceStatusLogId',
      'dmsl.id'
    )
    .leftJoin(
      'DeviceMaintenanceStatus as dms',
      'dmsl.deviceMaintenanceStatusId',
      'dms.id'
    )
    .select(
      'd.id',
      'd.name',
      'd.serial',
      'da.name as deviceApprovalStatus',
      'dms.name as deviceMaintenanceStatus'
    )
    .max('r.endedOn as lastUploadOn')
    .groupBy('d.id', 'd.name', 'd.serial')
    .modify(sortPageParams, query, 'name')
  const activityPercentPerMonth = knex
    .from(
      deviceStatusByDayQuery(dataConstraints, minDate, maxDate).as(
        'deviceStatusByDay'
      )
    )
    .groupBy([
      'deviceStatusByDay.deviceId',
      knex.raw(`YEAR(deviceStatusByDay.day)`),
      knex.raw(`MONTH(deviceStatusByDay.day)`),
    ])
    .select(
      'deviceStatusByDay.deviceId',
      // We are going to return the dates grouped by the user's timezone, and as the days are stored as only date,
      // then we will just transform (not convert!!!) those dates to the given offset
      knex.raw(`MONTH(deviceStatusByDay.day) as monthNumber`),
      knex.raw(`YEAR(deviceStatusByDay.day) as year`),
      getMonthYearUserTimeZoneField(
        knex,
        'deviceStatusByDay.day',
        'monthYear',
        offset
      ),
      knex.raw(
        'SUM(deviceStatusByDay.maintenanceStatusIsActive) AS activeDaysInMonth'
      ),
      knex.raw('COUNT(deviceStatusByDay.day) AS daysInMonth')
    )
  const [data, deviceDetails] = await Promise.all([
    getItems,
    activityPercentPerMonth,
  ])

  const maxDateFormatted = _.isDate(maxDate) ? maxDate : parseISO(maxDate)
  const minDateFormatted = _.isDate(minDate) ? minDate : parseISO(minDate)
  const monthDiff = differenceInMonths(maxDateFormatted, minDateFormatted)
  const dateFields = []
  const locale = culture.split('-')[0].toLowerCase()
  for (let i = 0; i <= monthDiff; i++) {
    dateFields.push({
      key: format(addMonths(minDateFormatted, i), 'yyyy-MM'),
      header: format(addMonths(minDateFormatted, i), 'yyyy-LLL', {
        locale: locales[locale],
      }),
    })
  }

  const devices = _.map(data, elem => {
    _.each(
      _.filter(
        deviceDetails,
        filteredElem => filteredElem.deviceId === elem.id
      ),
      detail => {
        elem[detail.monthYear] = detail.daysInMonth
          ? detail.activeDaysInMonth / detail.daysInMonth
          : ''
      }
    )

    return elem
  })
  const dataset = {
    ok: true,
    total: devices.length,
    length: devices.length,
    data: devices,
    dynamicColumns: dateFields,
  }
  return dataset
}

module.exports = {
  getDeviceActivityPercentReport,
}
