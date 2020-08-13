const _ = require('lodash')
const {
  addDays,
  format,
  parse,
  parseISO,
  isValid,
  toDate,
  isEqual,
} = require('date-fns')

const { convertToLocalTime } = require('date-fns-timezone')

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return parseDateOrDefault(date, defaultValue)
}

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

function formatDateOrDefault(date, dateFormat, defaultValue = null) {
  date = parseDateOrDefault(date)
  if (date == null) {
    return defaultValue
  }

  if (dateFormat != null) {
    return format(date, dateFormat)
  }

  return format(date, 'yyyy-MM-dd')
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

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
  formatDateOrDefault,
  returnIso8601StringWithoutTimeZoneOffset,
  dateEqual,
  getArrayOfDaysInRange,
  getLocalDateTimeStringInUtc,
  getLocalDateInUtc,
}
