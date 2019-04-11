module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', result => {
    result
      .integer('treatmentStatusLogId')
      .unsigned()
      .references('id')
      .inTable('ResultTreatmentStatusLog')
      .onDelete(null)
  })
}
async function down(knex) {
  await knex.schema.alterTable('Result', resultTreatmentStatus => {
    resultTreatmentStatus.dropForeign('treatmentStatusLogId')
    resultTreatmentStatus.dropColumn('treatmentStatusLogId')
  })
}
