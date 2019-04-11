module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', result => {
    result
      .integer('treatmentStatusWorkflowId')
      .unsigned()
      .references('id')
      .inTable('ResultTreatmentStatusLog')
      .onDelete(null)
  })
}
async function down(knex) {
  await knex.schema.alterTable('Result', resultTreatmentStatus => {
    resultTreatmentStatus.dropForeign('treatmentStatusWorkflowId')
    resultTreatmentStatus.dropColumn('treatmentStatusWorkflowId')
  })
}
