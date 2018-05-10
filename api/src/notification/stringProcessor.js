const { processUsingHandlebarsSyntax } = require('../stringTemplate/service')

// See unit tests for examples
const processStringTemplate = (
  inputString,
  site = {},
  device = {},
  result = {},
  person = {}
) => processUsingHandlebarsSyntax(inputString, { site, device, result, person })

const mergeTemplateData = (inputString, data) => {
  const { site, device, result, person } = data
  return processStringTemplate(inputString, site, device, result, person)
}

module.exports = {
  processStringTemplate,
  mergeTemplateData,
}
