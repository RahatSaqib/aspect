module.exports = require('../src/db').migration(up, down)


async function up(knex) {
  await knex.schema.alterTable('FormDefinition', form => {
    form.unique(['externalId','partnerId'])
  })
  await knex.schema.alterTable('FormDefinitionSchema', form => {
    form.unique(['jsonSchemaFile'])
  })
}

async function down(knex) {
  await knex.schema.alterTable('FormDefinition', form => {
    form.dropUnique(['externalId','partnerId'])
  })
  await knex.schema.alterTable('FormDefinitionSchema', form => {
    form.dropUnique(['jsonSchemaFile'])
  })
}
