async function up(knex) {
  await knex.schema.createTable('ResultTransferLog', resultTransferLog => {
    resultTransferLog.increments('id')
    resultTransferLog.integer('resultId').unsigned().index().references('id').inTable('Result')
    resultTransferLog.integer('reportableSiteId').unsigned().index().references('id').inTable('Site')
    resultTransferLog.integer('sampleOriginSiteId').unsigned().index().references('id').inTable('Site')
    resultTransferLog.integer('previousReportableSiteId').unsigned().index().references('id').inTable('Site')
    resultTransferLog.string('comment')
    resultTransferLog.dateTime('createdOn').notNullable().defaultTo(knex.fn.now())
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('ResultTransferLog')
}

module.exports = require('../src/db').migration(up, down)
