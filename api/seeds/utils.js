async function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}

async function getDefaultMessageTypes(knex) {
  return knex('MessageType as mt')
    .join('IssueType as it', 'it.defaultMessageTypeId', 'mt.id')
    .select('it.externalId as issueTypeExternalId', 'mt.*')
    .reduce((memo, row) => {
      memo[row.issueTypeExternalId] = row
      return memo
    }, {})
}

async function getPermissionModules(knex) {
  return knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})
}

async function seedFileContentTypes(knex) {
  const { contentTypes } = require('./fixtures/fileContentTypes')
  await Promise.all(
    contentTypes.map(async contentType => {
      const existingContentType = await knex('FileContentType')
        .where({ externalId: contentType.externalId })
        .first('id')
      if (existingContentType == null) {
        await knex('FileContentType').insert(contentType)
      }
    })
  )
}

module.exports = {
  rowsAsObject,
  getDefaultMessageTypes,
  getPermissionModules,
  seedFileContentTypes,
}
