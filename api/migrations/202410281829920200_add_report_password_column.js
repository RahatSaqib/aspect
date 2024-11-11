module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('NotificationType', t => {
    t.boolean('hasPassword')
    t.string('reportPassword').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('NotificationType', t => {
    t.dropColumn('hasPassword')
    t.dropColumn('reportPassword')
  })
}
