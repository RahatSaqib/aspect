const _ = require('lodash')
const dateFns = require('date-fns')

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return parseDateOrDefault(date, defaultValue)
}

function parseDateOrDefault(date, defaultValue = null) {
  if (date == null || date === '') {
    return defaultValue
  }
  const parsed = dateFns.toDate(date)
  return dateFns.isValid(parsed) ? parsed : defaultValue
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

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
  formatDateOrDefault,
  returnIso8601StringWithoutTimeZoneOffset,
}
