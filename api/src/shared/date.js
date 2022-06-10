const _ = require('lodash')
const {
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
  eachDayOfInterval,
  eachWeekendOfInterval,
} = require('date-fns')

const { convertToLocalTime, formatToTimeZone } = require('date-fns-timezone')

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

const getMonthYearField = (knex, field, alias = 'monthYear') =>
  knex.raw(`CONCAT_WS(
    '-',
    CAST(YEAR(${field}) AS CHAR ),
    LPAD(CAST(MONTH(${field}) AS CHAR ),2,'0')
    ) ${alias ? ` as ${alias}` : ''}`)

/**
 * - Generates knex code to project a datetime field in the specified timezone.
 * @param {*} knex - Knex ref.
 * @param {string} field - Name of the field to select.
 * @param {string} offset - Time offset in ISO format (e.g. +05:00)
 * @param {string=} alias - Optional. name to be returned if you don't want the field name.
 * @returns Expression to be added to a Knex query, returning plain datetime value converted a specified TZ
 * @example
 * e.g.:
 * getDateTimeProjectionInUserTimeZone(knex, 'd.lastSeenOn', '+05:00', 'lastSeen')
 * Then, for a DB value of 10/10/2005 23:28:30, you get 11/10/2005 04:28:30.
 */
const getDateTimeProjectionInUserTimeZone = (knex, field, offset, alias) =>
  knex.raw(
    `CONVERT_TZ(${field}, "+00:00", "${offset}") ${alias ? `as ${alias}` : ''}`
  )

const getISODateUserTimeZoneField = (
  knex,
  field,
  alias = 'isoDate',
  offset = '+00:00'
) =>
  knex.raw(
    `CONCAT(DATE_FORMAT(CONVERT_TZ(${field}, '+00:00', '${offset}'), '%Y-%m-%d'), 'T00:00:00.000${offset}') as ${alias}`
  )

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
function getArrayOfDaysInRange(
  start,
  end,
  initialProperties = null,
  excludeWeekends = false
) {
  if (typeof start === 'string') start = parseISO(start)

  if (typeof end === 'string') end = parseISO(end)

  let dates
  const allDates = eachDayOfInterval({ start, end }).map(d => d.toISOString())
  if (excludeWeekends) {
    const allWeekends = eachWeekendOfInterval({ start, end }).map(d =>
      d.toISOString()
    )
    dates = _.difference(allDates, allWeekends)
  } else dates = allDates

  return initialProperties
    ? dates.map(d => ({
        date: parseISO(d),
        ...initialProperties,
      }))
    : dates.map(d => parseISO(d))
}

// Returns the UTC equivalent of the passed in date/time string
// based on the timezone parameter
function getLocalDateTimeStringInUtc(dateString, timeZone = 'UTC') {
  if (!dateString || typeof dateString !== 'string') return null

  return convertToLocalTime(dateString, { timeZone })
}

/**
 * Convert a Timezone name in a timeOffset
 * @param {string} timeZone - ISO 8601 timezone String (i.e. Australia/Canberra)
 * @param {Date} date - Date to consider DST offset modifiers. fallback to new Date()
 * @returns - Time Offset in '[+/-]hh:mm' format (i.e. '+05:00')
 */
function getOffsetFromTimeZone(timeZone) {
  try {
    return formatToTimeZone(new Date(), 'Z', { timeZone })
  } catch (error) {
    return '+00:00'
  }
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

2020-11-26T15:00:24.000-11:00 (Milliseconds + Timezone Offset)
2020-11-26T15:00:24.000Z (Milliseconds Only)
2020-11-26T15:00:24-11:00 (Timezone Offset Only)
2020-11-26T15%3A00%3A24.000%2B11%3A00 (URI encoded)
*/
const REGEX_ISODATESTRING =
  /^\d{4}-[01]\d-[0-3]\dT[0-2]\d(:|%3A)[0-5]\d(:|%3A)[0-5]\d(\.\d{3})?(Z|[-+]|%2B)?(([0-2]\d)(:|%3A)([0-5]\d))?$/

function getOffsetFromIsoDateString(time) {
  return typeof time === 'string' &&
    REGEX_ISODATESTRING.test(time) &&
    time.slice(-1) !== 'Z'
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
  const timePart = date.toISOString().split('T')[1]
  if (timePart && timePart === '00:00:00.000Z') return date
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

function dayOfYear(date) {
  return parseInt(format(date, 'D', { useAdditionalDayOfYearTokens: true }), 10)
}

function getWellFormattedDateStringWithTimezone(dateTime) {
  return format(dateTime, 'yyyy-MM-dd HH:mm:ss.SSSxxx').replace(' ', 'T')
}

function getDatesFromQuery(query) {
  const now = new Date()
  const { minDate = startOfMonth(now), maxDate = endOfMonth(now) } = query
  return {
    dateFrom: _.isString(minDate) ? new Date(minDate) : minDate,
    dateTo: _.isString(maxDate) ? new Date(maxDate) : maxDate,
  }
}

/**
 * Retrieves the user timezone from the Person table in the database.
 * @param {knex} knex - Knex instance
 * @param {string} userName - User name
 * @returns {string} - User timezone name or 'UTC' if not found
 */
async function getTimeZoneFromUser(knex, userName) {
  const tz = await knex('User as u')
    .join('Person as p', 'u.id', 'p.userId')
    .join('TimeZone as tz', 'p.timezone', 'tz.id')
    .where('u.name', userName)
    .pluck('tz.timeZone')
  return tz || 'UTC'
}

/**
 *  Retrieves the user timezone from the DB and returns its timezone offset.
 * @param {*} knex - Knex instance
 * @param {*} userName - User name (can be taken from `auth.credentials.name`)
 * @returns string - Timezone offset in '[+/-]hh:mm' format (i.e. '+05:00')
 * @note It should be used as fallback for {@link getOffsetFromIsoDateString} when the request doesn't count with a date parameter.
 */
async function getOffsetFromUser(knex, userName) {
  const tz = await getTimeZoneFromUser(knex, userName)
  return getOffsetFromTimeZone(tz)
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
  getMonthYearField,
  getMonthYearUserTimeZoneField,
  getISODateUserTimeZoneField,
  getDateTimeProjectionInUserTimeZone,
  dayOfYear,
  getWellFormattedDateStringWithTimezone,
  getOffsetFromTimeZone,
  getDatesFromQuery,
  getTimeZoneFromUser,
  getOffsetFromUser,
}
