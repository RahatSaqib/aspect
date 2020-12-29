import addDays from 'date-fns/addDays'
import addMinutes from 'date-fns/addMinutes'
import closestTo from 'date-fns/closestTo'
import differenceInSeconds from 'date-fns/differenceInSeconds'
import endOfMonth from 'date-fns/endOfMonth'
import every from 'lodash/every'
import format from 'date-fns/format'
import getDate from 'date-fns/getDate'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import getHours from 'date-fns/getHours'
import getMinutes from 'date-fns/getMinutes'
import getMonth from 'date-fns/getMonth'
import getYear from 'date-fns/getYear'
import isDate from 'lodash/isDate'
import isString from 'lodash/isString'
import isValid from 'date-fns/isValid'
import isWithinInterval from 'date-fns/isWithinInterval'
import parseISO from 'date-fns/parseISO'
import range from 'lodash/range'
import setDate from 'date-fns/setDate'
import setHours from 'date-fns/setHours'
import setMinutes from 'date-fns/setMinutes'
import setMonth from 'date-fns/setMonth'
import setYear from 'date-fns/setYear'
import startOfMonth from 'date-fns/startOfMonth'
import subDays from 'date-fns/subDays'
import subMinutes from 'date-fns/subMinutes'
import subMonths from 'date-fns/subMonths'
import subtractYears from 'date-fns/subYears'
import times from 'lodash/times'
import upperFirst from 'lodash/upperFirst'

const now = new Date()
export const since = new Date(getYear(subtractYears(now, 10)), 0, 1)
export const until = new Date(getYear(subtractYears(now, -10)), 11, 31)
export const rangeIncludeLast = (start, end) => range(start, end + 1)

export const defaultYearList = rangeIncludeLast(getYear(since), getYear(until))
export const defaultMonthList = range(0, 12)
export const defaultDateList = rangeIncludeLast(1, 31)
export const defaultHourList = range(0, 24)
export const defaultMinuteList = range(0, 60)
export const defaultSecondList = range(0, 60)

export const accessOptions = {
  setYear,
  getYear,
  setMonth,
  getMonth,
  setDate,
  getDate,
  setHours,
  getHours,
  setMinutes,
  getMinutes,
}

export function getDateObject(value, defaultValue) {
  if (isString(value)) return parseISO(value)
  if (isDate(value)) return value
  if (defaultValue && !isDate(defaultValue)) {
    console.error(
      'getDateObject accepts only Date object for defaultValue if provided'
    )
  }
  return defaultValue
}

export function isValidDateRange(minDate, maxDate) {
  if (
    !isValid(maxDate) ||
    !isValid(minDate) ||
    differenceInSeconds(maxDate, minDate) < 0
  ) {
    return false
  }
  return true
}

export const isDateEqual = field => (date1, date2) => {
  const name = upperFirst(field)
  const get = accessOptions[`get${name}`]
  return get(date1) === get(date2)
}

export const isAllSameDateFields = (fields = []) => (date1, date2) =>
  every(fields, field => isDateEqual(field)(date1, date2))

export const normalizeDate = ({ date, minDate = since, maxDate = until }) => {
  if (!isValid(date)) {
    return minDate
  }

  if (isWithinInterval(parseISO(date), { start: minDate, end: maxDate })) {
    return date
  }
  return closestTo(date, [minDate, maxDate])
}

export function getYearList({ minDate = since, maxDate = until }) {
  if (!isValidDateRange(minDate, maxDate)) {
    return defaultYearList
  }
  return rangeIncludeLast(getYear(minDate), getYear(maxDate))
}

export function getMonthList({ date, minDate = since, maxDate = until }) {
  if (!isValid(date) || !isValidDateRange(minDate, maxDate)) {
    return defaultMonthList
  }

  const isEqualYear = isDateEqual('Year')

  if (isEqualYear(date, minDate)) {
    return range(getMonth(minDate), 12)
  }

  if (isEqualYear(date, maxDate)) {
    return rangeIncludeLast(0, getMonth(maxDate))
  }

  return defaultMonthList
}

export function getDateList({ date, minDate = since, maxDate = until }) {
  if (!isValid(date)) {
    return defaultDateList
  }

  if (!isValidDateRange(minDate, maxDate)) {
    return rangeIncludeLast(1, getDaysInMonth(date))
  }

  const isEqualYearAndMonth = isAllSameDateFields(['Year', 'Month'])
  if (isEqualYearAndMonth(date, minDate)) {
    return rangeIncludeLast(getDate(minDate), getDaysInMonth(minDate))
  }

  if (isEqualYearAndMonth(date, maxDate)) {
    return rangeIncludeLast(1, getDate(maxDate))
  }

  return rangeIncludeLast(1, getDaysInMonth(date))
}

export function getHourList({ date, minDate = since, maxDate = until }) {
  if (!isValid(date) || !isValidDateRange(minDate, maxDate)) {
    return defaultHourList
  }

  const isAllEqualFromYearToDate = isAllSameDateFields([
    'Year',
    'Month',
    'Date',
  ])
  if (isAllEqualFromYearToDate(date, minDate)) {
    return range(getHours(minDate), 24)
  }

  if (isAllEqualFromYearToDate(date, maxDate)) {
    return rangeIncludeLast(0, getHours(maxDate))
  }

  return defaultHourList
}

export function getMinuteList({ date, minDate = since, maxDate = until }) {
  if (!isValid(date) || !isValidDateRange(minDate, maxDate)) {
    return defaultMinuteList
  }

  const isAllEqualFromYearToHour = isAllSameDateFields([
    'Year',
    'Month',
    'Date',
    'Hours',
  ])
  if (isAllEqualFromYearToHour(date, minDate)) {
    return range(getMinutes(minDate), 60)
  }

  if (isAllEqualFromYearToHour(date, maxDate)) {
    return rangeIncludeLast(0, getMinutes(maxDate))
  }

  return defaultMinuteList
}

const getDayFromToday = cnt => format(addDays(new Date(), cnt), 'yyyy-MM-dd')

const negateTimeZoneOffset = dateString => {
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()

  return Math.sign(offset) !== -1
    ? addMinutes(date, offset)
    : subMinutes(date, Math.abs(offset))
}

const getISOFromString = date => {
  const jsDate = date ? new Date(date) : new Date()
  return format(jsDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
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
  dateRangeOptions,
  getAllDaysInCurrentMonth,
  getDayFromToday,
  getISOFromString,
  getTimePeriod,
  getPreviousPeriod,
  lastMonthLabel,
  negateTimeZoneOffset,
}
