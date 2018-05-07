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

const mergeTemplateData = (inputString, data) => {
  const { site, device, result, person } = data
  return processStringTemplate(inputString, site, device, result, person)
}

module.exports = {
  processStringTemplate,
  mergeTemplateData,
}
