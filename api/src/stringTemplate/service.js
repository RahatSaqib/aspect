const handlebars = require('handlebars')

// See unit tests for examples
function processUsingHandlebarsSyntax(inputString, data = {}) {
  const template = handlebars.compile(inputString)
  return template(data)
}

module.exports = {
  processUsingHandlebarsSyntax,
}
