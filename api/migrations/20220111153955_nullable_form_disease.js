module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('FormDefinition', formDefinition => {
    formDefinition.integer('diseaseId').unsigned().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('FormDefinition', formDefinition => {
    formDefinition.integer('diseaseId').unsigned().notNullable().alter()
  })
}
