const { addAuditFields } = require('./utils')
module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('PatientCaseTreatmentStatus', tbl => {
    tbl.increments('id').primary()
    tbl.string('name').notNullable()
    tbl.string('externalId').notNullable().unique()
    tbl.string('i18nKey').notNullable()
  })
  await knex.schema.createTable('PatientCaseTreatmentStatusLog', tbl => {
    tbl.increments('id').primary()
    tbl.integer('patientCaseId').notNullable().unsigned().index().references('id').inTable('PatientCase')
    tbl
      .integer('treatmentStatusId')
      .notNullable()
      .unsigned()
      .index()
      .references('id')
      .inTable('PatientCaseTreatmentStatus')
      .onDelete('CASCADE')
    tbl.string('data').nullable()
    tbl.string('method').nullable()
    addAuditFields(tbl)
  })

  await knex.schema.alterTable('PatientCase', result => {
    result
      .integer('treatmentStatusLogId')
      .unsigned()
      .references('id')
      .inTable('PatientCaseTreatmentStatusLog')
      .onDelete('SET NULL')
  })
}

async function down(knex) {
  await knex.schema.alterTable('PatientCase', tbl => {
    tbl.dropForeign('treatmentStatusLogId')
    tbl.dropColumn('treatmentStatusLogId')
  })
  await knex.schema.dropTable('PatientCaseTreatmentStatusLog')
  await knex.schema.dropTable('PatientCaseTreatmentStatus')
}
