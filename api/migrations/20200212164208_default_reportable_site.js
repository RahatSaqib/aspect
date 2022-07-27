module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', d => {
    d.integer('defaultReportableSiteId').after('siteId').unsigned().nullable().references('id').inTable('Site')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', x => {
    x.dropForeign('defaultReportableSiteId')
    x.dropColumns('defaultReportableSiteId')
  })
}
