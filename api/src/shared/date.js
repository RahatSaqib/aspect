const _ = require('lodash')
const { parse: parseDate } = require('date-fns')

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return date == null ? defaultValue : parseDateOrDefault(date, defaultValue)
}

function parseDateOrDefault(date, defaultValue = null) {
  if (date == null || date === '') {
    return defaultValue
  }
  return parseDate(date)
}

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
}
