const _ = require('lodash')
const dateFns = require('date-fns')

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
  const parsedDate =
    date instanceof Date
      ? date
      : options && options.formatString
      ? dateFns.parse(
          date,
          options.formatString,
          options.backupDate || getUtcTime()
        )
      : dateFns.toDate(dateFns.parseISO(date))
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

function dateEqual(date1, date2) {
  if ((!date1 && date2) || (date1 && !date2)) {
    return false
  }
  return dateFns.isEqual(date1, date2)
}

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
  formatDateOrDefault,
  returnIso8601StringWithoutTimeZoneOffset,
  getUtcTime,
  dateEqual,
}
