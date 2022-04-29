import addDays from 'date-fns/addDays'
import addMinutes from 'date-fns/addMinutes'
import closestTo from 'date-fns/closestTo'
import differenceInSeconds from 'date-fns/differenceInSeconds'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import every from 'lodash/every'
import format from 'date-fns/format'
import getDate from 'date-fns/getDate'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import getHours from 'date-fns/getHours'
import getMinutes from 'date-fns/getMinutes'
import getMonth from 'date-fns/getMonth'
import getYear from 'date-fns/getYear'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isDate from 'lodash/isDate'
import isObject from 'lodash/isObject'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import isValid from 'date-fns/isValid'
import isWithinInterval from 'date-fns/isWithinInterval'
import map from 'lodash/map'
import parseISO from 'date-fns/parseISO'
import range from 'lodash/range'
import setDate from 'date-fns/setDate'
import setHours from 'date-fns/setHours'
import setMinutes from 'date-fns/setMinutes'
import setMonth from 'date-fns/setMonth'
import setYear from 'date-fns/setYear'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import subDays from 'date-fns/subDays'
import subMinutes from 'date-fns/subMinutes'
import subMonths from 'date-fns/subMonths'
import subtractYears from 'date-fns/subYears'
import times from 'lodash/times'
import upperFirst from 'lodash/upperFirst'
import values from 'lodash/values'

import { i18nWrapper } from '../../../../Providers/I18nProvider'
import messages from '../messages'
import DATE_CONSTS from '../../../../globals/consts/DateTime/CONSTS'

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

export const isAllSameDateFields =
  (fields = []) =>
  (date1, date2) =>
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

const getISOFromString = (date, sod = true, eod = false) => {
  const iSOFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
  const checkForTimeStampRegex = RegExp('[T|:|s]')

  switch (true) {
    case isObject(date):
      return format(date, iSOFormat)

    case isEmpty(date):
      return format(new Date(), iSOFormat)

    case !checkForTimeStampRegex.test(date) && sod:
      return format(startOfDay(parseISO(date)), iSOFormat)

    case !checkForTimeStampRegex.test(date) && eod:
      return format(endOfDay(parseISO(date)), iSOFormat)

    default:
      return format(new Date(date), iSOFormat)
  }
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
      timePeriod = startOfMonthUTC(subMonths(dateNow, cnt).toISOString())
      break

    default:
      timePeriod = dateNow
      break
  }
  return format(timePeriod, dateFormat)
}
const startOfMonthUTC = dateString => {
  const [datepart, time] = dateString.split('T')

  const offset = time.split(
    /[0-2]\d:[0-5]\d:[0-5]\d\.\d+|[0-2]\d:[0-5]\d:[0-5]\d/
  )[1]
  return new Date(
    startOfMonth(new Date(`${datepart}T00:00:00.000Z`))
      .toISOString()
      .replace('T00:00:00.000Z', `T00:00:00.000${offset}`)
  )
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

const getPreviousPeriod = (
  period = 'month',
  dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
) => {
  // currently only works for month
  const previousPeriodStart = getTimePeriod(1, period, dateFormat)
  const previousPeriodEnd = format(
    endOfMonth(new Date(previousPeriodStart)),
    dateFormat
  )
  return { start: previousPeriodStart, end: previousPeriodEnd }
}

const monthRangeByCount = (date, offset, dateFormat) => ({
  minDate: format(startOfMonth(subMonths(date, offset)), dateFormat),
  maxDate: format(endOfMonth(subMonths(date, offset)), dateFormat),
})

const dateRangeOptions = (key, showLast30Days = true) => {
  const { format, formatDate, formatMessage } = i18nWrapper()
  const dateFormatValue = 'yyyy-MM-dd'
  const dateFormatRanges = {
    day: '2-digit',
    month: '2-digit',
  }
  const dateFormatMonths = { month: 'long', year: 'numeric' }
  const today = negateTimeZoneOffset(new Date())
  const dateRange = []

  if (showLast30Days)
    dateRange.push({
      id: DATE_CONSTS.DATE_RANGE_OPTIONS.LAST_30_DAYS,
      name: formatMessage
        ? formatMessage(messages.last30Days)
        : messages.hoursPlaceholder.id,
      value: {
        minDate: getTimePeriod(30, 'days', dateFormatValue),
        maxDate: format(today, dateFormatValue),
      },
    })

  dateRange.push({
    id: DATE_CONSTS.DATE_RANGE_OPTIONS.CURRENT_MONTH,
    name: formatMessage
      ? formatMessage(messages.thisMonth, {
          minDate: format(startOfMonth(today), 'dd-MM'),
          maxDate: format(endOfMonth(today), 'dd-MM'),
        })
      : messages.thisMonth.id,
    value: {
      minDate: format(startOfMonth(today), dateFormatValue),
      maxDate: format(endOfMonth(today), dateFormatValue),
    },
  })

  dateRange.push({
    id: DATE_CONSTS.DATE_RANGE_OPTIONS.LAST_MONTH,
    name: formatMessage(messages.lastMonth, {
      minDate: formatDate(startOfMonth(subMonths(today, 1)), dateFormatRanges),
      maxDate: formatDate(endOfMonth(subMonths(today, 1)), dateFormatRanges),
    }),
    value: monthRangeByCount(today, 1, dateFormatValue),
  })

  const monthsToGet = 10
  times(monthsToGet, month => {
    const count = month + 2
    dateRange.push({
      id: `MONTH-${count.toString().padStart(2, 0)}`,
      name: formatDate(subMonths(today, count), dateFormatMonths),
      value: monthRangeByCount(today, count, dateFormatValue),
    })
  })
  return {
    [key]: [...dateRange],
  }
}

const checkIfParamsIsDate = (params, encode = true) => {
  const {
    DATE_RANGE_KEYS,
    DATE_RANGE_START_OF_DAY_KEYS,
    DATE_RANGE_END_OF_DAY_KEYS,
  } = DATE_CONSTS
  const dateStringMatches = values(DATE_RANGE_KEYS)
  const startKeys = DATE_RANGE_START_OF_DAY_KEYS
  const endKeys = DATE_RANGE_END_OF_DAY_KEYS

  const iSOHelper = (value, key) =>
    encode
      ? encodeURIComponent(
          getISOFromString(
            value,
            startKeys.includes(key),
            endKeys.includes(key)
          )
        )
      : getISOFromString(value, startKeys.includes(key), endKeys.includes(key))

  if (isPlainObject(params)) {
    const output = [] // {}
    map(params, (value, key) => {
      const values = isArray(value) ? value : [value]
      return values.map(v =>
        output.push(
          `${key}=${dateStringMatches.includes(key) ? iSOHelper(v, key) : v}`
        )
      )
    })
    return output
  }

  if (isArray(params)) {
    const output = []
    map(params, param => {
      const [key, value] = Object.entries(param)[0]
      return output.push(
        `${key}=${
          dateStringMatches.includes(key) ? iSOHelper(value, key) : value
        }`
      )
    })
    return output
  }

  return false
}

const forceBaseFormatDate = date => format(parseISO(date), 'yyyy-MM-dd')

export {
  checkIfParamsIsDate,
  dateRangeOptions,
  forceBaseFormatDate,
  getAllDaysInCurrentMonth,
  getDayFromToday,
  getISOFromString,
  getTimePeriod,
  getPreviousPeriod,
  negateTimeZoneOffset,
}
