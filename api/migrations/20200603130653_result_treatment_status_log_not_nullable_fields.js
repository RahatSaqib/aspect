module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('ResultTreatmentStatusLog', tblResultTreatmentStatusLog => {
    tblResultTreatmentStatusLog.dropForeign('resultId')
    tblResultTreatmentStatusLog.dropForeign('resultTreatmentStatusId')
  })

  await knex.schema.alterTable('ResultTreatmentStatusLog', tblResultTreatmentStatusLog => {
    tblResultTreatmentStatusLog
      .integer('resultTreatmentStatusId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('ResultTreatmentStatus')
      .onDelete('CASCADE')
      .alter()

    tblResultTreatmentStatusLog
      .integer('resultId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Result')
      .onDelete('CASCADE')
      .alter()
  })
}

async function down(knex) {
  await knex.schema.table('ResultTreatmentStatusLog', tblResultTreatmentStatusLog => {
    tblResultTreatmentStatusLog.dropForeign('resultId')
    tblResultTreatmentStatusLog.dropForeign('resultTreatmentStatusId')
  })

  await knex.schema.alterTable('ResultTreatmentStatusLog', tblResultTreatmentStatusLog => {
    tblResultTreatmentStatusLog
      .integer('resultTreatmentStatusId')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('ResultTreatmentStatus')
      .onDelete('SET NULL')
      .alter()

    tblResultTreatmentStatusLog
      .integer('resultId')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('Result')
      .onDelete('SET NULL')
      .alter()
  })
}
