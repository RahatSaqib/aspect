const _ = require('lodash')

const { addUniqueKey, dropUniqueKey } = require('../seeds/utils')

module.exports = require('../src/db').migration(up, down)

const tablesWithUniqueKeys = [
  'IssueResolutionTrigger',
  'IssueEscalationTrigger',
  'NotificationType',
  'MessageType',
  'IssueType',
]

async function up(knex) {
  await Promise.all(
    _.map(tablesWithUniqueKeys, async tableName => {
      await addUniqueKey(knex, tableName)
    })
  )
}

async function down(knex) {
  await Promise.all(
    _.map(tablesWithUniqueKeys, async tableName => {
      await dropUniqueKey(knex, tableName)
    })
  )
}
