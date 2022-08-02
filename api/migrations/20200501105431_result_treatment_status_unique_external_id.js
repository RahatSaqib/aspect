module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  // set column resultTreatmentStatusId nullable
  await knex.schema.alterTable('ResultTreatmentStatus', resultTreatmentStatus => {
    resultTreatmentStatus.unique(['externalId'], 'ResultTreatmentStatus_externalId_unique')
  })
}

async function down(knex) {
  await knex.schema.table('ResultTreatmentStatus', resultTreatmentStatus => {
    resultTreatmentStatus.dropUnique(['externalId'], 'ResultTreatmentStatus_externalId_unique')
  })
}
