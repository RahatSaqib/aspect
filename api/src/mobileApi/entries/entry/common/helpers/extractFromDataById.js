const _ = require('lodash')

function extractFromDataById(data, key, id) {
  const filtered = _.filter(data, item => item[key] === id)
  return _.map(filtered, item => ({ ..._.omit(item, ['resultId']) }))
}

module.exports = { extractFromDataById }
