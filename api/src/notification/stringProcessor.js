const _ = require('lodash')

// See unit tests for examples
const processStringTemplate = (
  inputString,
  site = {},
  device = {},
  result = {},
  person = {}
) => {
  const inputObject = { site, device, result, person }
  const template = _.template(inputString)
  return template(inputObject)
}

module.exports = {
  processStringTemplate,
}
