async function up(knex) {
  await knex.schema.alterTable('ResultStatusLog', table => {
    table.integer('previousReportableSiteId').index('previousReportableSiteId_index')
    table.integer('sampleOriginSiteId').index('sampleOriginSiteId_index')
    table.integer('reportableSiteId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('ResultStatusLog', function (table) {
    table.dropIndex('', 'previousReportableSiteId_index')
    table.dropIndex('', 'sampleOriginSiteId_index')
  })
}

module.exports = require('../src/db').migration(up, down)
