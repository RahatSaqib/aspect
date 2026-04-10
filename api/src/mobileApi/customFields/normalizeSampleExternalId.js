const _ = require('lodash')

function normalizeOptionalString(value) {
  if (_.isNil(value)) {
    return null
  }

  if (!_.isString(value)) {
    return value
  }

  const trimmedValue = value.trim()
  return trimmedValue === '' ? null : trimmedValue
}

module.exports = { normalizeOptionalString }
