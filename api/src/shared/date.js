const _ = require('lodash')
const dateFns = require('date-fns')

const { DateTimeFormat: intlFormat } = require('intl')
const shortNumericDateFormat = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}

function getDateOrDefault(object, propertyPath, defaultValue) {
  const date = _.get(object, propertyPath)
  return parseDateOrDefault(date, defaultValue)
}

function parseDateOrDefault(date, defaultValue = null) {
  if (date == null || date === '') {
    return defaultValue
  }
  const parsed = dateFns.parse(date)
  return dateFns.isValid(parsed) ? parsed : defaultValue
}

function formatDate(date, { culture, dateFormat } = {}) {
  if (date == null || date === '') {
    return ''
  }
  if (dateFormat != null) {
    return dateFns.format(date, dateFormat)
  } else if (
    culture != null &&
    intlFormat.supportedLocalesOf(culture).length > 0
  ) {
    return intlFormat(culture).format(date, shortNumericDateFormat)
  }
  return dateFns.format(date, 'YYYY-MM-DD')
}

module.exports = {
  getDateOrDefault,
  parseDateOrDefault,
  formatDate,
}
