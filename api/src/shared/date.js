const _ = require('lodash')
const { findIana, findWindows } = require('windows-iana')
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
  eachWeekendOfInterval,
  differenceInDays,
  min,
  max,
  addMonths,
  eachDayOfInterval,
  isWeekend,
  endOfDay,
  subDays,
  addMilliseconds,
} = require('date-fns')

const { convertToLocalTime, formatToTimeZone } = require('date-fns-timezone')
const { formatInTimeZone, zonedTimeToUtc } = require('date-fns-tz')

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return parseDateOrDefault(date, defaultValue)
}

function getTimezoneOffsetFromNumber(timezoneOffset) {
  let offset = -Math.round(timezoneOffset / 60)
  const plusOrMinus = offset >= 0 ? '+' : '-'
  offset = Math.abs(offset)
  offset = `${plusOrMinus}${_.padStart(offset, 2, '0')}:00`
  return offset
}

/** Slides an UTC date the amount of hours between UTC and the specified IANA timezone
 * @param {date} date - An UTC date
 * @param {string} timeZoneIANA - A String representing a IANA time zone
 * @returns a new Date object representing the same date and time in the target timezone
 * @example
 * slideDateToTimeZone(new Date(2030,0,1), 'Asia/Karachi')
 *
 * will return 2030-01-01T05:00:00.000Z wich is zero hours of new year in Karachi (+05:00)
 * @description This function returns a different moment that the one specified.
 */
const slideDateToTimeZone = function (date, timeZoneIANA) {
  if (!timeZoneIANA) {
    throw new Error('slideDateToTimeZone: Timezone is required')
  }
  return zonedTimeToUtc(date, timeZoneIANA)
}

/** Format an UTC Date into a full ISO string in the time offset of specified time zone
 * @param {Date} date - An UTC date
 * @param {String} timeZoneIANA - A string representing a IANA time zone
 * @returns a string representing the same date in the specified offset
 * @example
 * formatDateInTimeZone(new Date(2030,0,1), 'Asia/Karachi')
 *
 * Will return a '2030-01-01T05:00:00+05:00', note that it's the same date as input parameter,
 * just expressed in Karachi time zone
 */
const formatDateInTimeZone = (date, timeZoneIANA) => formatInTimeZone(date, timeZoneIANA, "yyyy-MM-dd'T'HH:mm:ssXXX")

/** Changes the time offset of a date to get the same date and time in the target time zone.
 * @param {Date} date - An UTC date
 * @param {String} timeZoneIANA - A string representing a IANA time zone
 * @returns A new Date object slided the amount of hours between UTC and the input time zone, expressed as ISO full string
 * @description This function it's the same as chain slideDateToTimeZone and then formatDateInTimeZone.
 * @example
 * Given 2020-01-01T00:00:00.000Z as date and 'Asia/Karachi' time zone, it will return 2020-01-01T00:00:00.000+05:00.
 * Note that it takes into account DST, as it's not performing a simple replace but using date-fns-tz library.
 */
const replaceOffset = (date, timeZoneIANA) =>
  formatDateInTimeZone(slideDateToTimeZone(date, timeZoneIANA), timeZoneIANA)

const getMonthYearUserTimeZoneField = (knex, field, alias = 'monthYear', offset = '+00:00') => {
  return knex.raw(`CONCAT_WS(
    '-',
    CAST(YEAR(CONVERT_TZ(${field},'+00:00','${offset}')) AS CHAR ),
    LPAD(CAST(MONTH(CONVERT_TZ(${field},'+00:00','${offset}')) AS CHAR ),2,'0')
    ) ${alias ? ` as ${alias}` : ''}`)
}

const getMonthYearExpressionFromFieldInTimeZone = (knex, field, alias = 'monthYear', timeZoneIANA) => {
  return knex.raw(`DATE_FORMAT(CONVERT_TZ(${field}, 'UTC', '${timeZoneIANA}'), '%Y-%m')${alias ? ` AS ${alias}` : ''}`)
}

const getMonthYearField = (knex, field, alias = 'monthYear') =>
  knex.raw(`CONCAT_WS(
    '-',
    CAST(YEAR(${field}) AS CHAR ),
    LPAD(CAST(MONTH(${field}) AS CHAR ),2,'0')
    ) ${alias ? ` as ${alias}` : ''}`)

/**
 * Generates knex code to project a datetime field in the specified timezone.
 * @param {*} knex - Knex ref.
 * @param {string} field - Name of the field to select.
 * @param {string} timeZoneIANA - Timezone name in IANA format (e.g. 'Asia/Karachi')
 * @param {string=} alias - Optional. name to be returned if you don't want the field name. If it's not provided,
 * no alias will be added.
 * @returns Expression to be added to a Knex query, returning plain datetime value converted a specified TZ
 * @example
 * e.g.:
 * getDateTimeProjectionInTimeZoneIANA(knex, 'd.lastSeenOn', 'Asia/Dhaka', 'lastSeen')
 * Then, for a DB value of 10/10/2005 23:28:30, this function will generate:
 * `CONVERT_TZ('2005-10-10 23:28:30', '+00:00', 'Asia/Dhaka') as lastSeen`, and you'll get 11/10/2005 05:28:30.
 * @description - NOTE: Trying to use CONVERT_TZ with the overload that accepts a time offset, e.g. '+06:00'
 * is not recommended, as will not take into account DST changes.
 * The table mysql.time_zone_name is populated from devops project in all Aspect intances.
 * see https://systemone.youtrack.cloud/articles/ENG-A-332/Date-and-Time-zone-handling-in-Aspect
 */
const getDateTimeProjectionInTimeZoneIANA = (knex, field, timeZoneIANA, alias) => {
  return knex.raw(`CONVERT_TZ(${field}, "+00:00", "${timeZoneIANA}")${alias ? ` as ${alias}` : ''}`)
}

/**
 * - Generates knex code build an expression over a datetime field in the specified timezone.
 * @param {*} knex - Knex ref.
 * @param {string} field - Name of the field to select.
 * @param {string} timeZoneIANA - Timezone name in IANA format (e.g. 'Asia/Karachi')
 * @returns Expression to be added to a Knex query, representing plain datetime value converted a specified TZ
 * @example
 * .where('r.endedOn', '>', getDateTimeExpressionInTimeZone(knex, 'd.lastSeenOn', 'Asia/Dhaka'))
 * returns:
 * where `r.endedOn` > CONVERT_TZ(`d.lastSeen`, '+00:00', 'Asia/Dhaka')
 */
const getDateTimeExpressionInTimeZone = (knex, field, timeZoneIANA) =>
  knex.raw(`CONVERT_TZ(${field}, "+00:00", "${timeZoneIANA}")`)

function parseDateOrDefault(date, options = { formatString: null, backupDate: null, defaultDate: null }) {
  const defaultValue = _.isPlainObject(options) ? options.defaultDate : options
  if (date == null || date === '') {
    return defaultValue
  }
  let parsedDate
  if (date instanceof Date) {
    parsedDate = date
  } else if (options && options.formatString) {
    parsedDate = parse(date, options.formatString, options.backupDate || new Date())
  } else {
    parsedDate = toDate(parseISO(date))
  }
  return isValid(parsedDate) ? parsedDate : defaultValue
}

function formatDateOrDefault(date, dateFormat = 'yyyy-MM-dd', defaultValue = null) {
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

/**
 * Returns an array of dates formatted as "yyyy-MM-dd" in the given range
 * If initialProperties is passed in, returns an array of objects with "date" containing
 * the day's date and initial properties set to the passed in object
 * @param {*} start - initial date (included)
 * @param {*} end - final date (included)
 * @param {*} initialProperties - optional. object with initial properties to be returned with a `date` property added.
 * @param {*} excludeWeekends - optional. boolean to exclude weekends from the returned array
 * @returns {Array} - array of dates formatted as "yyyy-MM-dd" or array ob objects with "date" property and specified initial properties if such parameter exists
 */
function getArrayOfDaysInRange(start, end, initialProperties = null, excludeWeekends = false) {
  if (typeof start === 'string') start = parseISO(start)

  if (typeof end === 'string') end = parseISO(end)

  let allDates = []
  let current = start
  while (current <= end) {
    allDates = [...allDates, current.toISOString()]
    current = addDays(current, 1)
  }
  let dates = allDates
  if (excludeWeekends) {
    const allWeekends = eachWeekendOfInterval({ start, end }).map(d => d.toISOString())
    dates = _.difference(allDates, allWeekends)
  }
  return initialProperties
    ? dates.map(d => ({
        date: parseISO(d),
        ...initialProperties,
      }))
    : dates.map(d => parseISO(d))
}

function getYear(date) {
  const yearPart = date.split('T')[0]
  const utcDate = yearPart ? new Date(yearPart ? `${yearPart}T00:00:00.000Z` : undefined) : new Date()
  return utcDate.getUTCFullYear()
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

2020-11-26T15:00:24.000-11:00 (Milliseconds + Timezone Offset)
2020-11-26T15:00:24.000Z (Milliseconds Only)
2020-11-26T15:00:24-11:00 (Timezone Offset Only)
2020-11-26T15%3A00%3A24.000%2B11%3A00 (URI encoded)
*/
const REGEX_ISODATESTRING =
  /^\d{4}-[01]\d-[0-3]\dT[0-2]\d(:|%3A)[0-5]\d(:|%3A)[0-5]\d(\.\d{3})?(Z|[-+]|%2B)?(([0-2]\d)(:|%3A)([0-5]\d))?$/

// this works with iso format dates with timezones.
const endOfMonthUTC = dateString => {
  const [datepart, time] = dateString.split('T')

  const offset = time.split(/[0-2]\d:[0-5]\d:[0-5]\d\.\d+|[0-2]\d:[0-5]\d:[0-5]\d/)[1]
  return new Date(
    endOfMonth(new Date(`${datepart}T23:59:59.999Z`))
      .toISOString()
      .replace('T23:59:59.999Z', `T23:59:59.999${offset}`)
  )
}
// this works with iso format dates with timezones.
const startOfMonthUTC = dateString => {
  const [datepart, time] = dateString.split('T')

  const offset = time.split(/[0-2]\d:[0-5]\d:[0-5]\d\.\d+|[0-2]\d:[0-5]\d:[0-5]\d/)[1]
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

function endOfDayUtc(date) {
  const timePart = date.toISOString().split('T')[1]
  if (timePart && timePart === '00:00:00.000Z') return date
  return subDays(addMinutes(endOfDay(date), -date.getTimezoneOffset()), 1)
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

// Return Wed Aug 24 2022 02:25:32 GMT-4
function getFormattedDateTimeWithTimezone(dateTime, timezone) {
  timezone = timezone || 'Etc/UTC'
  return formatInTimeZone(dateTime, timezone, 'E MMM dd yyyy HH:mm:ss O')
}

// Returns Wed Aug 24 2022
function getFormattedDate(dateTime, timezone) {
  timezone = timezone || 'Etc/UTC'
  return formatInTimeZone(dateTime, timezone, 'E MMM dd yyyy')
}

/**
 * Returns a positive integer indicating the number of days between 2 dates
 */
function daysBetweenDates(date1, date2) {
  return differenceInDays(max([date1, date2]), min([date1, date2]))
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

function getDatesFromQuery(query) {
  const now = new Date()
  const { minDate = startOfMonth(now), maxDate = endOfMonth(now) } = query
  return {
    dateFrom: _.isString(minDate) ? startOfDayUtc(new Date(minDate)) : minDate,
    dateTo: _.isString(maxDate) ? endOfDayUtc(new Date(maxDate)) : maxDate,
  }
}

/** Converts a Timezone name in a timeOffset
 * @param {string} timeZone - ISO 8601 timezone String (i.e. Australia/Canberra)
 * @param {Date} date - Date to consider DST offset modifiers. fallback to new Date()
 * @returns - Time Offset in '[+/-]hh:mm' format (i.e. '+05:00')
 * @description - Useful when you need to use mysql CONVERT_TZ function,
 * which takes as argument the time offset in the format this function returns.
 */
function getOffsetFromTimeZone(timeZone, date = new Date()) {
  try {
    return formatToTimeZone(date, 'Z', { timeZone })
  } catch (error) {
    return '+00:00'
  }
}

/**
 * Returns the offset in minuts from a given string representing an ISO date.
 * @param {*} isoDateTime - ISO date string (ex.: 2020-01-02T00:30:10.432-03:00)
 * @returns Number - Timezone offset in minutos (i.e. -180)
 */
function getOffsetFromIsoDateStringInMinutes(isoDateTime) {
  if (!REGEX_ISODATESTRING.test(isoDateTime)) throw new Error('Parameter is not an ISO date string')
  return (-1 * (new Date(isoDateTime) - new Date(isoDateTime.slice(0, 10)))) / 1000 / 60
}

/**
 * Returns the timezone offset in string in '[+/-]hh:mm' format
 * @param {string} isoDateTime - ISO date string (ex.: 2020-01-02T00:30:10.432-03:00)
 * @returns String containing the timezone offset in '[+/-]hh:mm' format, (i.e. '-03:00')
 */
function getOffsetFromIsoDateString(isoDateTime) {
  const isoDateTimeSting = _.isDate(isoDateTime) ? isoDateTime.toISOString() : isoDateTime
  return typeof isoDateTime === 'string' &&
    REGEX_ISODATESTRING.test(isoDateTimeSting) &&
    isoDateTimeSting.slice(-1) !== 'Z'
    ? isoDateTime.slice(-6)
    : '+00:00'
}

/**
 * Returns the timezone in IANA
 * @param {string} Timezone - i.e. Eastern Standard Time
 * @returns String containing the IANA timezone - i.e. America/New_York
 */
function convertTimezonetoIANA(timezone) {
  const [convertedTimezone] = findIana(timezone)
  return convertedTimezone
}

/**
 * Returns the timezone in Windows IANA
 * @param {string} TimezoneIANA - i.e. America/New_York
 * @returns String containing the Windows IANA timezone - i.e. Eastern Standard Time
 */
function convertTimezonetoWindowsIANA(timezoneIANA) {
  const [convertedTimezone] = findWindows(timezoneIANA)
  return convertedTimezone
}

/**
 * Returns the timezone in IANA
 * @param {string} Timezone - i.e. Eastern Standard Time
 * @returns Array containing the IANA timezone - i.e. [America/New_York]
 */
function arrayofIANATimezone(timezone) {
  return findIana(timezone)
}

function getUserStartOfMonth(date, userTimeZoneOffsetInMinutes) {
  return addMinutes(startOfMonth(addMinutes(date, userTimeZoneOffsetInMinutes)), -userTimeZoneOffsetInMinutes)
}

function getUserEndOfMonth(date, userTimeZoneOffsetInMinutes) {
  return addMinutes(endOfMonth(addMinutes(date, userTimeZoneOffsetInMinutes)), -userTimeZoneOffsetInMinutes)
}

/**
 * This function is used for reports that show data grouped in months and accept date-range filtering. Expects a min and max date objects, and the offset in minutes of the user's timezone, and generates the collection of user months and the UTC ranges to filter in the database.
 * @param {*} minDate The min date object from the filter
 * @param {*} maxDate The max date object from the filter
 * @param {*} userTimeZoneOffsetInMinutes The timezone offset of the user
 * @returns The collection of months and date ranges for db queries
 */
function getAllUserMonthsInRange(minDate, maxDate, userTimeZoneOffsetInMinutes) {
  const allRanges = []
  let currentDate = minDate
  let endOfMonthDate = getUserEndOfMonth(currentDate, userTimeZoneOffsetInMinutes)
  while (currentDate <= maxDate) {
    const userMonth = format(addMinutes(currentDate, userTimeZoneOffsetInMinutes), 'yyyy-MM')

    const maxCurrentDate = maxDate < endOfMonthDate ? maxDate : endOfMonthDate

    allRanges.push({
      userMonth,
      minDate: currentDate,
      maxDate: maxCurrentDate,
    })
    currentDate = addMilliseconds(maxCurrentDate, 1) // next starting date
    endOfMonthDate = getUserEndOfMonth(currentDate, userTimeZoneOffsetInMinutes)
  }

  return allRanges
}

function getAllMonthsInRange(minDate, maxDate) {
  minDate = _.isString(minDate) ? minDate : minDate.toISOString()
  maxDate = _.isString(maxDate) ? maxDate : maxDate.toISOString()
  let allRanges = []
  let currentMonth = getLocalDateTimeStringInUtc(minDate)
  while (currentMonth <= getLocalDateTimeStringInUtc(maxDate)) {
    allRanges = [...allRanges, format(currentMonth, 'yyyy-MM')]
    currentMonth = addMonths(currentMonth, 1)
  }
  return allRanges.sort()
}

function getDateInMilliSeconds(date) {
  const providedDate = new Date(date)
  return providedDate.getTime()
}

/**
 *  Retrieves the No of working days excluding weekends
 * @deprecated This function is obsolete as it does not contemplate the weekends in PartnerData.customWorkingDays.
 * TODO: It must be merged with getWorkingDays function from api/src/device/utilizationReports/index.js instead,
 * which properly handles client-specific working day configurations. date-fns isWeekend is not applicable to countries
 * with different weekend days than Saturday and Sunday.
 * @see {@link HD-15651 Replace the user of date-fns weekend by custom Partner configuration}
 * @param {*} startDate
 * @param {*} endDate
 * @returns number - Return the count of working days
 */
function getWorkingDays(startDate, endDate) {
  // Generate an array of all dates between the start and end dates
  const allDates = eachDayOfInterval({ start: startDate, end: endDate })

  // Filter out weekends (Saturdays and Sundays)
  const workingDays = allDates.filter(date => !isWeekend(date))

  // Return the count of working days
  return workingDays.length
}

const adjustDate = (date, tz) => (tz ? slideDateToTimeZone(date, tz) : date)

/**
 * Converts MySQL DAYOFWEEK() format to date-fns getDay() format
 * @param {number} day - MySQL day of week (1-7), Sunday is 1
 * @returns {number} date-fns day of week (0-6), Sunday is 0
 * @description
 * MySQL DAYOFWEEK(): 1 = Sunday, 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 7 = Saturday
 * date-fns getDay(): 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
 */
const convertMysqlDayOfWeekToDateFns = day => day - 1

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
  formatDateOrDefault,
  returnIso8601StringWithoutTimeZoneOffset,
  dateEqual,
  getArrayOfDaysInRange,
  getYear,
  getLocalDateTimeStringInUtc,
  getLocalDateInUtc,
  getTimeZoneById,
  startOfDayUtc,
  endOfDayUtc,
  startOfTodayUtc,
  startOfMonthUTC,
  endOfMonthUTC,
  REGEX_ISODATESTRING,
  getDateSubstring,
  getMonthYearField,
  getMonthYearUserTimeZoneField,
  getDateTimeExpressionInTimeZone,
  dayOfYear,
  getWellFormattedDateStringWithTimezone,
  getFormattedDateTimeWithTimezone,
  getFormattedDate,
  getDatesFromQuery,
  getOffsetFromTimeZone,
  slideDateToTimeZone,
  formatDateInTimeZone,
  replaceOffset,
  getOffsetFromIsoDateString,
  getOffsetFromIsoDateStringInMinutes,
  getTimeZoneFromUser,
  getOffsetFromUser,
  getTimezoneOffsetFromNumber,
  convertTimezonetoIANA,
  convertTimezonetoWindowsIANA,
  daysBetweenDates,
  arrayofIANATimezone,
  getAllMonthsInRange,
  getAllUserMonthsInRange,
  getUserEndOfMonth,
  getUserStartOfMonth,
  getDateInMilliSeconds,
  getWorkingDays,
  getDateTimeProjectionInTimeZoneIANA,
  adjustDate,
  getMonthYearExpressionFromFieldInTimeZone,
  convertMysqlDayOfWeekToDateFns,
}
