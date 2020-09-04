import addDays from 'date-fns/addDays'
import addMinutes from 'date-fns/addMinutes'
import format from 'date-fns/format'
import startOfMonth from 'date-fns/startOfMonth'
import endOfMonth from 'date-fns/endOfMonth'
import subMinutes from 'date-fns/subMinutes'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'
import times from 'lodash/times'

/**
 * TODO: Should move this to a more central helpers file for all date stuff
 * https://github.com/SystemOneId/aspect/issues/1308
 */

const getDayFromToday = cnt => format(addDays(new Date(), cnt), 'yyyy-MM-dd')

const negateTimeZoneOffset = dateString => {
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()

  return Math.sign(offset) !== -1
    ? addMinutes(date, offset)
    : subMinutes(date, Math.abs(offset))
}

const getTimePeriod = (cnt, period, dateFormat) => {
  let timePeriod
  const dateNow = new Date()
  switch (true) {
    case period === 'hours':
      timePeriod = subDays(dateNow, cnt)
      break
    case period === 'days':
      timePeriod = subDays(dateNow, cnt)
      break
    case period === 'months':
      timePeriod = startOfMonth(subMonths(dateNow, cnt))
      break

    default:
      timePeriod = dateNow
      break
  }
  return format(timePeriod, dateFormat)
}

const getAllDaysInCurrentMonth = (
  upToToday = false,
  dateFormat = 'yyyy-MM-dd'
) => {
  const dateNow = new Date()
  const start = startOfMonth(dateNow)
  const end = upToToday ? dateNow : endOfMonth(dateNow)
  return { start: format(start, dateFormat), end: format(end, dateFormat) }
}

const getPreviousPeriod = (period = 'month', dateFormat) => {
  // currently only works for month
  const previousPeriodStart = format(
    negateTimeZoneOffset(getTimePeriod(1, period, dateFormat)),
    dateFormat
  )
  const previousPeriodEnd = format(
    endOfMonth(negateTimeZoneOffset(previousPeriodStart)),
    dateFormat
  )
  return { start: previousPeriodStart, end: previousPeriodEnd }
}

const monthRangeByCount = (date, offset, dateFormat) => ({
  minDate: format(startOfMonth(subMonths(date, offset)), dateFormat),
  maxDate: format(endOfMonth(subMonths(date, offset)), dateFormat),
})

const lastMonthLabel = (date, count, dateFormat) =>
  `Last Month (${format(
    startOfMonth(subMonths(date, count)),
    dateFormat
  )} - ${format(endOfMonth(subMonths(date, count)), dateFormat)})`

const dateRangeOptions = key => {
  const dateFormatLabel = 'dd/MM'
  const dateFormatValue = 'yyyy-MM-dd'
  const dateFormatMonths = 'MMMM yyyy'
  const monthsToGet = 12
  const today = negateTimeZoneOffset(new Date())
  const dateRange = [
    {
      id: 0,
      name: 'Last 30 Days',
      value: {
        minDate: getTimePeriod(30, 'days', dateFormatValue),
        maxDate: format(today, dateFormatValue),
      },
    },
  ]
  times(monthsToGet, month => {
    const count = month + 1
    switch (count) {
      case 1:
        dateRange.push({
          id: count,
          name: `This Month (${format(
            startOfMonth(today),
            dateFormatLabel
          )} - ${format(endOfMonth(today), dateFormatLabel)})`,
          value: {
            minDate: format(startOfMonth(today), dateFormatValue),
            maxDate: format(endOfMonth(today), dateFormatValue),
          },
        })
        break

      case 2:
        dateRange.push({
          id: count,
          name: lastMonthLabel(today, month, dateFormatLabel),
          value: monthRangeByCount(today, month, dateFormatValue),
        })
        break

      default:
        dateRange.push({
          id: count,
          name: format(subMonths(today, month), dateFormatMonths),
          value: monthRangeByCount(today, month, dateFormatValue),
        })
        break
    }
  })
  return {
    [key]: [...dateRange],
  }
}

export {
  getAllDaysInCurrentMonth,
  dateRangeOptions,
  getDayFromToday,
  getTimePeriod,
  getPreviousPeriod,
  lastMonthLabel,
  negateTimeZoneOffset,
}
