const handlebars = require('handlebars')

// See unit tests for examples
function processUsingHandlebarsSyntax(inputString, data = {}) {
  const template = handlebars.compile(inputString)
  return template(data)
}

function getMustacheTokensInString(inputString) {
  return inputString.match(/{{\s*[\w.[\]\s]+\s*}}/g)
}

module.exports = {
  processUsingHandlebarsSyntax,
  getMustacheTokensInString,
}
