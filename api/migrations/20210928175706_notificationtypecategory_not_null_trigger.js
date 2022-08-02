module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex('NotificationTypeCategory').update('triggerCondition', '{}').whereNull('triggerCondition')
  await knex.schema.alterTable('NotificationTypeCategory', tbl => {
    tbl.json('triggerCondition').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('NotificationTypeCategory', tbl => {
    tbl.json('triggerCondition').nullable().alter()
  })
}
