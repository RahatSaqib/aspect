const _ = require('lodash')

/**
 * Extracts data from a list of objects based on a key and id
 * @param {Array} data - List of entries
 * @param {String} key - Key to filter by
 * @param {String} id - Id to filter by
 * @returns {Array} - List of objects ordered by updatedOn
 */

function extractFromDataById(data, key, id) {
  const filtered = _.filter(data, item => item[key] === id)
  return _.orderBy(
    _.map(filtered, item => ({ ..._.omit(item, ['resultId']) })),
    ['updatedOn'],
    ['desc']
  )
}

module.exports = { extractFromDataById }
