module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex('AssayType')
    .update({ abbreviation: knex.raw('??', ['externalId']) })
    .whereNull('abbreviation')
  await knex('Assay')
    .update({ abbreviation: knex.raw('??', ['externalId']) })
    .whereNull('abbreviation')

  await knex.schema.alterTable('Assay', assay => {
    assay.string('abbreviation').notNullable().alter()
  })
  await knex.schema.alterTable('AssayType', assayType => {
    assayType.string('abbreviation').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('AssayType', assayType => {
    assayType.string('abbreviation').nullable().alter()
  })
  await knex.schema.alterTable('Assay', assay => {
    assay.string('abbreviation').nullable().alter()
  })
}
