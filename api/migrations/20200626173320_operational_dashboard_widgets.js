module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DashboardWidget', tbl => {
    tbl.string('dashboard').notNullable().defaultTo('home')
  })
}

async function down(knex) {
  await knex.schema.alterTable('DashboardWidget', tbl => {
    tbl.dropColumn('dashboard')
  })
}
