import addDays from 'date-fns/addDays'
import addMinutes from 'date-fns/addMinutes'
import format from 'date-fns/format'
import startOfMonth from 'date-fns/startOfMonth'
import endOfMonth from 'date-fns/endOfMonth'
import subMinutes from 'date-fns/subMinutes'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'

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

export {
  getAllDaysInCurrentMonth,
  getDayFromToday,
  getTimePeriod,
  getPreviousPeriod,
  negateTimeZoneOffset,
}
