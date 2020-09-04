module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DashboardWidget', tbl => {
    tbl.specificType('linkParams', 'JSON')
  })
}

async function down(knex) {
  await knex.schema.alterTable('DashboardWidget', tbl => {
    tbl.dropColumn('linkParams')
  })
}
