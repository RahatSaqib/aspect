import addDays from 'date-fns/addDays'
import addMinutes from 'date-fns/addMinutes'
import format from 'date-fns/format'
import startOfMonth from 'date-fns/startOfMonth'
import subMinutes from 'date-fns/subMinutes'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'

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

export { getDayFromToday, negateTimeZoneOffset, getTimePeriod }
