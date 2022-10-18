module.exports = require('../src/db').migration(up, down)

const upsertReports = require('../seeds/common/upsert_reports')

async function up(knex) {
  await knex.schema.table('Report', report => {
    report.string('i18nKeyDescription')
  })
  await upsertReports(knex, {}, ['exportCsv', 'exportExcel', 'availableForNotification'])
  await knex.schema.alterTable('Report', tblReport => {
    tblReport.string('i18nKeyDescription').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.table('Report', tblReport => {
    tblReport.dropColumn('i18nKeyDescription')
  })
}
