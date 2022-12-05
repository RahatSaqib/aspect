const _ = require('lodash')
const { addMonths, differenceInMonths, format, parseISO, subMonths, subDays } = require('date-fns')
const locales = require('date-fns/locale')
const { getDeviceBaseExtendedQuery } = require('../device/service')
const { deviceStatusByDayQuery, getDeviceStatusOverTime } = require('./service')
const { knex, sortPageParams } = require('../db')
const { getConstraints } = require('../auth/constraints')
const {
  getMonthYearField,
  getOffsetFromIsoDateString,
  parseDateOrDefault,
  getDateTimeProjectionInUserTimeZone,
} = require('../shared/date')
const { getPersonByPersonId } = require('../auth/service')

async function getDeviceActivityPercentReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getPersonByPersonId(auth.credentials.personId)
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints)
  const { minDate = subMonths(new Date(), 12).toISOString(), maxDate = new Date().toISOString() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin('Result as r', 'd.id', 'r.deviceId')
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .distinct(
      'd.id',
      'd.name',
      'd.serial',
      'da.name as deviceApprovalStatus',
      'dms.name as deviceMaintenanceStatus',
      getDateTimeProjectionInUserTimeZone(knex, 'MAX(r.endedOn)', offset, 'lastUploadOn')
    )
    .whereNotIn('dt.externalId', ['Aspect', 'GxAlert'])
    .groupBy('d.id', 'd.name', 'd.serial')
    .modify(sortPageParams, query, 'name')
  const minDateDateValue = parseDateOrDefault(minDate)

  const maxDateDateValue = parseDateOrDefault(maxDate)
  const activityPercentPerMonth = knex
    .from(
      knex
        .from(deviceStatusByDayQuery(dataConstraints, minDate, maxDate).as('deviceStatusByDay'))
        .leftJoin('Result as r', qb => {
          qb.on('deviceStatusByDay.deviceId', 'r.deviceId')
            .andOn('r.endedOn', '>=', 'deviceStatusByDay.day')
            .andOn('r.endedOn', '<', knex.raw('DATE_ADD(deviceStatusByDay.day, INTERVAL 1 DAY)'))
        })
        .select(
          'deviceStatusByDay.deviceId',
          'deviceStatusByDay.day',
          'deviceStatusByDay.maintenanceStatusExternalId',
          'deviceStatusByDay.maintenanceStatusIsActive',
          knex.raw('SUM(CASE WHEN r.id IS NULL THEN 0 ELSE 1 END) as numberOfResultsForDay')
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
      getMonthYearField(knex, 'MAX(deviceStatusByDayWithResultCounts.day)', 'monthYear', offset),
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
  const [data, deviceDetails] = await Promise.all([getItems, activityPercentPerMonth])
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
      _.filter(deviceDetails, filteredElem => filteredElem.deviceId === elem.id),
      ({ activeDaysInMonth, daysInMonth, monthYear }) => {
        elem[monthYear] = daysInMonth ? `${((activeDaysInMonth / daysInMonth) * 100).toFixed(2)}%` : ''
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

async function getDeviceUtilizationPerDayReport(auth, query) {
  if (query.maxDate) query.maxDate = new Date(query.maxDate)

  const { maxDate = new Date(), minDate } = query
  if (!minDate) {
    query.minDate = subDays(maxDate, 30).toISOString()
  }
  if (_.isDate(query.minDate)) {
    query.minDate = query.minDate.toISOString()
  }

  let data = await getDeviceStatusOverTime(auth, query)
  /**
   * define dynamic columns which are day dates in period
   */
  let dateFields = []
  const [{ maintenanceStatusHistory = [] } = {}] = data || []
  dateFields = maintenanceStatusHistory.map(({ day }) => {
    return {
      key: day,
      header: day, // notice that `day` is in 'yyyy-MM-dd' format
      subHeaders: [
        {
          text: '#',
        },
        {
          text: '%',
        },
      ],
    }
  })

  data = data.map(device => {
    const { deviceCapacity = 12, name, maintenanceStatusHistory } = device
    let totals = 0
    let cntWorkingDays = 0
    const dynamicFields = _.reduce(
      maintenanceStatusHistory,
      (acc, item) => {
        const { day, isWeekend, totalResults } = item
        totals += totalResults
        if (!isWeekend || totalResults > 0) {
          cntWorkingDays += 1
        }
        /**
         * cell value is plain object which must have 1 mandatory prop `value`
         * and may have 1 optional prop `style`
         */
        acc[day] = [
          // item for 1st subHeader `#`
          {
            value: totalResults,
          },
          // item for 2nd subHeader `%`
          {
            value: deviceCapacity && deviceCapacity > 0 ? totalResults / deviceCapacity : 'N/A',
            style: { numFmt: '0.00%' },
          },
        ]

        return acc
      },
      {}
    )
    const utilizationRate = cntWorkingDays > 0 && deviceCapacity > 0 ? totals / (deviceCapacity * cntWorkingDays) : 0
    return {
      name,
      totalResults: totals,
      deviceCapacity,
      utilizationRate,
      ...dynamicFields,
    }
  })

  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    dynamicColumns: dateFields,
  }
}

module.exports = {
  getDeviceActivityPercentReport,
  getDeviceUtilizationPerDayReport,
}
