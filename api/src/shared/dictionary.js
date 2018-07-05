const { knex } = require('../db')

const cacheKeyToId = {}

function keyToId(table, keyColumn = 'externalId') {
  return async (key = null) => {
    let cache = cacheKeyToId[table]
    if (cache == null) {
      cache = await knex(table)
        .select('id', keyColumn)
        .reduce((memo, row) => {
          memo[row[keyColumn]] = row.id
          return memo
        }, {})
      cacheKeyToId[table] = cache
    }
    return key == null ? cache : cache[key]
  }
}

module.exports = {
  fileContentTypeToId: keyToId('FileContentType'),
  issueEventStatusToId: keyToId('IssueEventStatus'),
  issueStatusToId: keyToId('IssueStatus'),
  issueTypeToId: keyToId('IssueType'),
  messageStatusToId: keyToId('MessageStatus'),
  resultCategoryToId: keyToId('ResultCategory'),
}
