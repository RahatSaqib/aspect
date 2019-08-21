module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', result => {
    result
      .integer('treatmentStatusLogId')
      .unsigned()
      .after('resultWorkflowStatusId')
      .references('id')
      .inTable('ResultTreatmentStatusLog')
      .onDelete('SET NULL')
  })
}
async function down(knex) {
  await knex.schema.alterTable('Result', resultTreatmentStatus => {
    resultTreatmentStatus.dropForeign('treatmentStatusLogId')
    resultTreatmentStatus.dropColumn('treatmentStatusLogId')
  })
}
