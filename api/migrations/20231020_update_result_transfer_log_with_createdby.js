async function up(knex) {
  await knex.schema.alterTable('ResultTransferLog', resultTransferLog => {
    resultTransferLog.integer('createdBy').unsigned().index().references('id').inTable('Person')
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
