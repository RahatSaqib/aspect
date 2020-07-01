module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('DashboardWidget', tblWidget => {
    tblWidget.string('description')
    tblWidget.string('descriptionI18nKey')
  })
}

async function down(knex) {
  await knex.schema.table('DashboardWidget', tblWidget => {
    tblWidget.dropColumn('description')
    tblWidget.dropColumn('descriptionI18nKey')
  })
}
