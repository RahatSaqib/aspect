module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('NotificationType', tbl => {
    tbl.bool('enabled').notNullable().default(true)
  })
}

async function down(knex) {
  await knex.schema.alterTable('NotificationType', tbl => {
    tbl.dropColumn('enabled')
  })
}
