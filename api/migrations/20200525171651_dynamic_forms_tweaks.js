module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('FormDefinition', formDefinition => {
    formDefinition.unique(['externalId', 'partnerId'], 'unique_externalId_partnerId_FormDefinition')
  })
  await knex.schema.alterTable('FormDefinitionSchema', formDefinitionSchema => {
    formDefinitionSchema.unique(['jsonSchemaFile'], 'unique_jsonSchemaFile_FormDefinitionSchema')
  })
}

async function down(knex) {
  await knex.schema.alterTable('FormDefinition', formDefinition => {
    formDefinition.dropUnique(['externalId', 'partnerId'], 'unique_externalId_partnerId_FormDefinition')
  })
  await knex.schema.alterTable('FormDefinitionSchema', formDefinitionSchema => {
    formDefinitionSchema.dropUnique(['jsonSchemaFile'], 'unique_jsonSchemaFile_FormDefinitionSchema')
  })
}
