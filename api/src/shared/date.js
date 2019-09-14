const _ = require('lodash')
const dateFns = require('date-fns')

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return parseDateOrDefault(date, defaultValue)
}

function parseDateOrDefault(
  date,
  options = { formatString: null, backupDate: null }
) {
  const defaultValue = _.isDate(options) ? options : options.backupDate
  if (date == null || date === '') {
    return defaultValue
  }
  const parsedDate = date instanceof Date ? date : (options.formatString
    ? dateFns.parse(date, options.formatString, options.backupDate)
    : dateFns.toDate(date))
  return dateFns.isValid(parsedDate) ? parsedDate : defaultValue
}

function formatDateOrDefault(date, dateFormat, defaultValue = null) {
  date = parseDateOrDefault(date)
  if (date == null) {
    return defaultValue
  }

  if (dateFormat != null) {
    return dateFns.format(date, dateFormat)
  }

  return dateFns.format(date, 'yyyy-MM-dd')
}

function returnIso8601StringWithoutTimeZoneOffset(date) {
  if (!date) {
    return null
  }
  return `${date.toISOString().split('.')[0]}.000`
}

// When performing MySQL INSERTS or UPDATES using knex,
//   the time zone offset seems to be ignored.
//   This function offsets the hours and minutes of the
//   date object passed into it to the time as it is at
//   UTC. This is particularly useful for updating and
//   inserting into updatedOn and createdOn fields
function getUtcTime(localTime) {
  const time = localTime || new Date()
  return new Date(time.getTime() + time.getTimezoneOffset() * 60000)
}

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
  formatDateOrDefault,
  returnIso8601StringWithoutTimeZoneOffset,
  getUtcTime,
}
