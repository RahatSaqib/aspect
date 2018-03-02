const _ = require('lodash')

// See unit tests for sample input strings and input object
const process = function(inputString, inputObject) {
  const template = _.template(inputString)
  return template(inputObject)
}

module.exports = {
  process,
}
