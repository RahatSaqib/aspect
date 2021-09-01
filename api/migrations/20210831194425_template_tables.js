const { seedTable } = require('../seeds/utils')
module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('AlertTemplate', tbl => {
    tbl
      .string('externalId', 255)
      .unique()
      .after('id')
  })
  await knex.schema.alterTable('EmailTemplate', tbl => {
    tbl
      .string('externalId', 255)
      .unique()
      .after('id')
  })
  await knex.schema.alterTable('SmsTemplate', tbl => {
    tbl
      .string('externalId', 255)
      .unique()
      .after('id')
  })
}

async function down(knex) {
  await knex.schema.alterTable('AlertTemplate', tbl => {
    tbl.dropColumn('externalId')
  })
  await knex.schema.alterTable('EmailTemplate', tbl => {
    tbl.dropColumn('externalId')
  })
  await knex.schema.alterTable('SmsTemplate', tbl => {
    tbl.dropColumn('externalId')
  })
}
