const _ = require('lodash')
const { parse: parseDate, isValid: isValidDate } = require('date-fns')

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return date == null ? defaultValue : parseDateOrDefault(date, defaultValue)
}

function parseDateOrDefault(date, defaultValue = null) {
  if (date == null || date === '') {
    return defaultValue
  }
  const parsed = parseDate(date)
  return isValidDate(parsed) ? parsed : defaultValue
}

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
}
