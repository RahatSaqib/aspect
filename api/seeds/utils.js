const { readJson } = require('fs-extra')

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

async function seedStaticData(knex) {
  const tables = ['FileStatus', 'FileContentType']
  await Promise.all(
    tables.map(async table => {
      const { data } = await readJson(`./seeds/fixtures/${table}.json`)
      await Promise.all(
        data.map(async datum => {
          const existingDatum = await knex(table)
            .where({ externalId: datum.externalId })
            .first('id')
          if (existingDatum == null) {
            await knex(table).insert(datum)
          }
        })
      )
    })
  )
}

module.exports = {
  rowsAsObject,
  getDefaultMessageTypes,
  getPermissionModules,
  seedStaticData,
}
