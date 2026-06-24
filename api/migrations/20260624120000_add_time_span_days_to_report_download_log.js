module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('ReportDownloadLog', table => {
    table.integer('timeSpanDays').unsigned().nullable()
  })
}

async function down(knex) {
  await knex.schema.table('ReportDownloadLog', table => {
    table.dropColumn('timeSpanDays')
  })
}
