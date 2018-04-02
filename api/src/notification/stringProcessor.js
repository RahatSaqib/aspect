const handlebars = require('handlebars')

// See unit tests for examples
const processStringTemplate = (
  inputString,
  site = {},
  device = {},
  result = {},
  person = {}
) => {
  const data = { site, device, result, person }
  const template = handlebars.compile(inputString)
  return template(data)
}

module.exports = {
  processStringTemplate,
}
