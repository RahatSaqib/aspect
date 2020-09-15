import upperFirst from 'lodash/upperFirst'
import every from 'lodash/every'
import range from 'lodash/range'
import isString from 'lodash/isString'
import isDate from 'lodash/isDate'
import isValid from 'date-fns/isValid'
import getYear from 'date-fns/getYear'
import setYear from 'date-fns/setYear'
import getMonth from 'date-fns/getMonth'
import setMonth from 'date-fns/setMonth'
import getDate from 'date-fns/getDate'
import setDate from 'date-fns/setDate'
import getHours from 'date-fns/getHours'
import setHours from 'date-fns/setHours'
import getMinutes from 'date-fns/getMinutes'
import setMinutes from 'date-fns/setMinutes'
import differenceInSeconds from 'date-fns/differenceInSeconds'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import subtractYears from 'date-fns/subYears'
import closestTo from 'date-fns/closestTo'
import isWithinInterval from 'date-fns/isWithinInterval'
import parseISO from 'date-fns/parseISO'

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
    // eslint-disable-next-line no-console
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
