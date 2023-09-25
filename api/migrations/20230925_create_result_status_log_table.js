async function up(knex) {
  await knex.schema.createTable('ResultTransferLog', resultTransferLog => {
    resultTransferLog.increments('id')
    resultTransferLog.integer('resultId').unsigned().index().references('id').inTable('Result').onDelete('SET NULL')
    resultTransferLog.integer('reportableSiteId').notNullable().index()
    resultTransferLog.integer('sampleOriginSiteId').notNullable().index()
    resultTransferLog.integer('previousReportableSiteId').notNullable().index()
    resultTransferLog.dateTime('createdOn').notNullable().defaultTo(knex.fn.now())
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('ResultTransferLog')
}

module.exports = require('../src/db').migration(up, down)
