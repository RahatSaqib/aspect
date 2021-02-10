const _ = require('lodash')
const {
  addDays,
  addMinutes,
  format,
  parse,
  parseISO,
  isValid,
  toDate,
  isEqual,
  startOfDay,
  startOfToday,
  startOfMonth,
  endOfMonth,
} = require('date-fns')

const { convertToLocalTime } = require('date-fns-timezone')

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return parseDateOrDefault(date, defaultValue)
}

const getMonthYearUserTimeZoneField = (
  knex,
  field,
  alias = 'monthYear',
  offset = '+00:00'
) =>
  knex.raw(`CONCAT_WS(
    '-',
    CAST(YEAR(CONVERT_TZ(${field},'+00:00','${offset}')) AS CHAR ),
    LPAD(CAST(MONTH(CONVERT_TZ(${field},'+00:00','${offset}')) AS CHAR ),2,'0')
    ) ${alias ? ` as ${alias}` : ''}`)

function parseDateOrDefault(
  date,
  options = { formatString: null, backupDate: null, defaultDate: null }
) {
  const defaultValue = _.isPlainObject(options) ? options.defaultDate : options
  if (date == null || date === '') {
    return defaultValue
  }
  let parsedDate
  if (date instanceof Date) {
    parsedDate = date
  } else if (options && options.formatString) {
    parsedDate = parse(
      date,
      options.formatString,
      options.backupDate || new Date()
    )
  } else {
    parsedDate = toDate(parseISO(date))
  }
  return isValid(parsedDate) ? parsedDate : defaultValue
}

function formatDateOrDefault(
  date,
  dateFormat = 'yyyy-MM-dd',
  defaultValue = null
) {
  date = parseDateOrDefault(date)
  if (date == null) {
    return defaultValue
  }

  return format(date, dateFormat)
}

function returnIso8601StringWithoutTimeZoneOffset(date) {
  if (!date) {
    return null
  }
  return `${date.toISOString().split('.')[0]}.000`
}

function dateEqual(date1, date2) {
  if ((!date1 && date2) || (date1 && !date2)) {
    return false
  }
  const typeSafeDate1 = date1 instanceof Date ? date1 : parseISO(date1)
  const typeSafeDate2 = date2 instanceof Date ? date2 : parseISO(date2)
  return isEqual(typeSafeDate1, typeSafeDate2)
}

// Returns an array of dates formatted as "yyyy-MM-dd" in the given range
// If initialProperties is passed in, returns an array of objects with "date" containing
// the day's date and initial properties set to the passed in object
function getArrayOfDaysInRange(minDate, maxDate, initialProperties = null) {
  const dates = []
  let typeSafeMinDate = minDate instanceof Date ? minDate : parseISO(minDate)
  const typeSafeMaxDate = maxDate instanceof Date ? maxDate : parseISO(maxDate)

  while (typeSafeMinDate <= typeSafeMaxDate) {
    dates.push(
      initialProperties
        ? { date: typeSafeMinDate, ...initialProperties }
        : typeSafeMinDate
    )
    typeSafeMinDate = addDays(typeSafeMinDate, 1)
  }
  return dates
}

// Returns the UTC equivalent of the passed in date/time string
// based on the timezone parameter
function getLocalDateTimeStringInUtc(dateString, timeZone = 'UTC') {
  if (!dateString || typeof dateString !== 'string') return null

  return convertToLocalTime(dateString, { timeZone })
}

function getLocalDateInUtc(dateTime) {
  return convertToLocalTime(dateTime, { timeZone: 'UTC' })
}

// Returns a timezone's ISO-name based on the ID that is passed in
// For example, "Eastern Standard Time" will return "America/New_York"
function getTimeZoneById(allTimeZones, timeZoneId) {
  return _.findKey(allTimeZones, _.partial(_.isEqual, timeZoneId || 'UTC'))
}
/*
These are the different patterns of date format this regular expression validate.
for further information check the unit test api/test/shared/date.test.js:65

2020-11-26T15:00:24.000-11:00
2020-11-26T15:00:24.000Z
2020-11-26T15:00:24-11:00
*/
const REGEX_ISODATESTRING = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/

function getOffsetFromIsoDateString(time) {
  return time.slice(-1) !== 'Z' && REGEX_ISODATESTRING.test(time)
    ? time.slice(-6)
    : '+00:00'
}

// this works with iso format dates with timezones.
const endOfMonthUTC = dateString => {
  const [datepart, time] = dateString.split('T')

  const offset = time.split(
    /[0-2]\d:[0-5]\d:[0-5]\d\.\d+|[0-2]\d:[0-5]\d:[0-5]\d/
  )[1]
  return new Date(
    endOfMonth(new Date(`${datepart}T23:59:59.999Z`))
      .toISOString()
      .replace('T23:59:59.999Z', `T23:59:59.999${offset}`)
  )
}
// this works with iso format dates with timezones.
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
function startOfDayUtc(date) {
  return addMinutes(startOfDay(date), -date.getTimezoneOffset())
}

function startOfTodayUtc() {
  const date = startOfToday()
  return addMinutes(date, -date.getTimezoneOffset())
}

/**
 * Returns the date part of a DateTime string in ISO format
 *
 * @param {string} isoDateTime The DateTime in ISO format (ex.: 2020-01-02T00:30:10.432-03:00).
 */
function getDateSubstring(isoDateTime) {
  return isoDateTime.substring(0, 10)
}

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
  formatDateOrDefault,
  returnIso8601StringWithoutTimeZoneOffset,
  dateEqual,
  getArrayOfDaysInRange,
  getLocalDateTimeStringInUtc,
  getLocalDateInUtc,
  getTimeZoneById,
  startOfDayUtc,
  startOfTodayUtc,
  startOfMonthUTC,
  endOfMonthUTC,
  getOffsetFromIsoDateString,
  REGEX_ISODATESTRING,
  getDateSubstring,
  getMonthYearUserTimeZoneField,
}
