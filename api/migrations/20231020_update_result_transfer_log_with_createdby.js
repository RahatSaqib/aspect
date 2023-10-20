async function up(knex) {
  await knex.schema.alterTable('ResultTransferLog', resultTransferLog => {
    resultTransferLog.integer('createdBy').unsigned().index().references('id').inTable('User')
    resultTransferLog.integer('siteId').unsigned().index().references('id').inTable('Site')
  })
}

async function down(knex) {
  await knex.schema.alterTable('ResultTransferLog', resultTransferLog => {
    resultTransferLog.dropColumn('createdBy')
  })
}

module.exports = {
  up,
  down,
}
