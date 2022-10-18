const { addUniqueKey, dropUniqueKey } = require('../seeds/utils')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  const tableName = 'MessageType'
  await dropUniqueKey(knex, tableName)
  await addUniqueKey(knex, tableName)
}

async function down(knex) {
  const tableName = 'MessageType'
  await dropUniqueKey(knex, tableName)
  await knex.schema.alterTable(tableName, table => {
    table.unique(
      ['messageSeverityId', 'alertTemplateId', 'smsTemplateId', 'emailTemplateId', 'webhookTemplateId'],
      `${tableName}_unique`
    )
  })
}
