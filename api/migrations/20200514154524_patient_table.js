module.exports = require('../src/db').migration(up, down)

const { addAuditFields } = require('./utils')

async function up(knex) {
  await knex.schema.createTable('Patient', patient => {
    patient.increments('id').primary()
    patient.integer('partnerId').unsigned().index().references('id').inTable('Partner').onDelete('SET NULL')
    patient.string('externalId').notNullable()
    patient.boolean('reliable').notNullable().default(false)
    patient.boolean('died').notNullable().default(false)
    patient.json('data').notNullable()
    addAuditFields(patient)
  })
  await knex.schema.alterTable('Sample', sample => {
    sample.integer('patientId').unsigned().index().references('id').inTable('Patient').onDelete('CASCADE')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Sample', sample => {
    sample.dropForeign('patientId')
    sample.dropColumn('patientId')
  })
  await knex.schema.dropTable('Patient')
}
