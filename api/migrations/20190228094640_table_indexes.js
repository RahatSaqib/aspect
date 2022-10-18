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
const messageTables = ['AlertMessage', 'EmailMessage', 'SmsMessage']

async function up(knex) {
  await Promise.all(
    _.map(tablesWithUniqueKeys, async tableName => {
      await addUniqueKey(knex, tableName)
    })
  )

  // set 'CASCADE' for 'deviceId' FK
  await Promise.all(
    _.map(messageTables, async tableName => {
      await knex.schema.alterTable(tableName, table => {
        table.dropForeign('deviceId')
        table.integer('deviceId').unsigned().references('id').inTable('Device').onDelete('CASCADE').alter()
      })
    })
  )
}

async function down(knex) {
  await Promise.all(
    _.map(tablesWithUniqueKeys, async tableName => {
      await dropUniqueKey(knex, tableName)
    })
  )

  // reset 'CASCADE' for 'deviceId' FK
  await Promise.all(
    _.map(messageTables, async tableName => {
      await knex.schema.alterTable(tableName, table => {
        table.dropForeign('deviceId')
        table.integer('deviceId').unsigned().references('id').inTable('Device').alter()
      })
    })
  )
}
