const _ = require('lodash')

function convertStringToFloat(stringValue) {
  const convertedValue = parseFloat(stringValue)
  if (_.isNaN(convertedValue)) {
    return null
  }
  return convertedValue
}

module.exports = {
  convertStringToFloat,
}
