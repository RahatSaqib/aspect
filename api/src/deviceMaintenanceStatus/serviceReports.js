const _ = require('lodash')
const { format, parseISO, addMonths, differenceInMonths } = require('date-fns')
const locales = require('date-fns/locale')
const { getDeviceBaseQuery } = require('../device/service')
const { deviceStatusByDayQuery } = require('./service')
const { knex, sortPageParams } = require('../db')
const { getConstraints } = require('../auth/constraints')
const {
  getMonthYearField,
  getOffsetFromIsoDateString,
  parseDateOrDefault,
} = require('../shared/date')
const { getUser } = require('../auth/service')

async function getDeviceActivityPercentReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getUser(auth.credentials.name)
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)
  const {
    minDate = addMonths(new Date(), -12).toISOString(),
    maxDate = new Date().toISOString(),
  } = query
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
  const minDateDateValue = parseDateOrDefault(minDate)
  const maxDateDateValue = parseDateOrDefault(maxDate)
  const activityPercentPerMonth = knex
    .from(
      knex
        .from(
          deviceStatusByDayQuery(dataConstraints, minDate, maxDate).as(
            'deviceStatusByDay'
          )
        )
        .leftJoin('Result as r', qb => {
          qb.on('deviceStatusByDay.deviceId', 'r.deviceId')
            .andOn('r.endedOn', '>=', 'deviceStatusByDay.day')
            .andOn(
              'r.endedOn',
              '<',
              knex.raw('DATE_ADD(deviceStatusByDay.day, INTERVAL 1 DAY)')
            )
        })
        .select(
          'deviceStatusByDay.deviceId',
          'deviceStatusByDay.day',
          'deviceStatusByDay.maintenanceStatusExternalId',
          'deviceStatusByDay.maintenanceStatusIsActive',
          knex.raw(
            'SUM(CASE WHEN r.id IS NULL THEN 0 ELSE 1 END) as numberOfResultsForDay'
          )
        )
        .groupBy('deviceStatusByDay.deviceId', 'deviceStatusByDay.day')
        .as('deviceStatusByDayWithResultCounts')
    )
    .groupBy([
      'deviceStatusByDayWithResultCounts.deviceId',
      knex.raw(`YEAR(deviceStatusByDayWithResultCounts.day)`),
      knex.raw(`MONTH(deviceStatusByDayWithResultCounts.day)`),
    ])
    .select(
      'deviceStatusByDayWithResultCounts.deviceId',
      // We are going to return the dates grouped by the user's timezone, and as the days are stored as only date,
      // then we will just transform (not convert!!!) those dates to the given offset
      knex.raw(`MONTH(deviceStatusByDayWithResultCounts.day) as monthNumber`),
      knex.raw(`YEAR(deviceStatusByDayWithResultCounts.day) as year`),
      getMonthYearField(
        knex,
        'MAX(deviceStatusByDayWithResultCounts.day)',
        'monthYear',
        offset
      ),
      knex.raw(
        `SUM(CASE WHEN DAYOFWEEK(deviceStatusByDayWithResultCounts.day) = 7 OR DAYOFWEEK(deviceStatusByDayWithResultCounts.day) = 1 OR (deviceStatusByDayWithResultCounts.maintenanceStatusExternalId = 'active' AND deviceStatusByDayWithResultCounts.numberOfResultsForDay = 0) THEN 0 ELSE deviceStatusByDayWithResultCounts.maintenanceStatusIsActive END) AS activeDaysInMonth`
      ),
      knex.raw(
        `(5 * (DATEDIFF(CASE WHEN YEAR(deviceStatusByDayWithResultCounts.day) = ${maxDateDateValue.getFullYear()} AND MONTH(deviceStatusByDayWithResultCounts.day) = ${
          maxDateDateValue.getMonth() + 1
        } THEN '${format(
          maxDateDateValue,
          'yyyy-MM-dd'
        )}' ELSE LAST_DAY(deviceStatusByDayWithResultCounts.day) END, CASE WHEN YEAR(deviceStatusByDayWithResultCounts.day) = ${minDateDateValue.getFullYear()} AND MONTH(deviceStatusByDayWithResultCounts.day) = ${
          minDateDateValue.getMonth() + 1
        } THEN '${format(
          minDateDateValue,
          'yyyy-MM-dd'
        )}' ELSE DATE_SUB(deviceStatusByDayWithResultCounts.day, INTERVAL DAYOFMONTH(deviceStatusByDayWithResultCounts.day) - 1 DAY) END) DIV 7) + MID('0123444401233334012222340111123400001234000123440', 7 * WEEKDAY(CASE WHEN YEAR(deviceStatusByDayWithResultCounts.day) = ${minDateDateValue.getFullYear()} AND MONTH(deviceStatusByDayWithResultCounts.day) = ${
          minDateDateValue.getMonth() + 1
        } THEN '${format(
          minDateDateValue,
          'yyyy-MM-dd'
        )}' ELSE DATE_SUB(deviceStatusByDayWithResultCounts.day, INTERVAL DAYOFMONTH(deviceStatusByDayWithResultCounts.day) - 1 DAY) END) + WEEKDAY(CASE WHEN YEAR(deviceStatusByDayWithResultCounts.day) = ${maxDateDateValue.getFullYear()} AND MONTH(deviceStatusByDayWithResultCounts.day) = ${
          maxDateDateValue.getMonth() + 1
        } THEN '${format(
          maxDateDateValue,
          'yyyy-MM-dd'
        )}' ELSE LAST_DAY(deviceStatusByDayWithResultCounts.day) END) + 1, 1)) + 1 AS daysInMonth`
      )
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
          ? `${((detail.activeDaysInMonth / detail.daysInMonth) * 100).toFixed(
              2
            )}%`
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
