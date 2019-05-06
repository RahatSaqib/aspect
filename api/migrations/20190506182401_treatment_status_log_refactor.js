module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  // set column resultTreatmentStatusId nullable
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t.dropForeign('resultTreatmentStatusId')
    t.dropColumn('resultTreatmentStatusId')
  })
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t
      .integer('resultTreatmentStatusId')
      .unsigned()
      .after('resultId')
      .nullable()
      .index()
      .references('id')
      .inTable('ResultTreatmentStatus')
      .onDelete('SET NULL')
  })
}

async function down(knex) {
  // reset column resultTreatmentStatusId (see 20190402123141_addTreatment_status.js)
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t.dropForeign('resultTreatmentStatusId')
    t.dropColumn('resultTreatmentStatusId')
  })
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t
      .integer('resultTreatmentStatusId')
      .unsigned()
      .after('resultId')
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultTreatmentStatus')
  })
}
