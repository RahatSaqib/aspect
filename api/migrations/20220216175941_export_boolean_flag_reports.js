module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Report', tbl => {
    tbl.boolean('exportCsv').default(1)
    tbl.boolean('exportExcel').default(1)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Report', tbl => {
    tbl.dropColumn('exportCsv')
    tbl.dropColumn('exportExcel')
  })
}
