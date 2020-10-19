module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('DashboardWidget', tbl => {
    tbl.specificType('options', 'JSON')
  })
}

async function down(knex) {
  await knex.schema.table('DashboardWidget', tbl => {
    tbl.dropColumn('options')
  })
}
