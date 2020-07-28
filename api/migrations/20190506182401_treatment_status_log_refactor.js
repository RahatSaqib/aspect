module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  // set column resultTreatmentStatusId nullable
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t.dropForeign('resultTreatmentStatusId')
    t.dropColumn('resultTreatmentStatusId')
  })
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t.integer('resultTreatmentStatusId')
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
  await knex.schema.table('ResultTreatmentStatusLog', t => {
    t.dropForeign('resultTreatmentStatusId')
  })

  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t.integer('resultTreatmentStatusId')
      .unsigned()
      .after('resultId')
      .notNullable()
      .references('id')
      .inTable('ResultTreatmentStatus')
      .alter()
  })
}
