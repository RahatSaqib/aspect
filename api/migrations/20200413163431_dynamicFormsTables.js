module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('FormType', row => {
    row.increments('id')
    row.string('name').notNullable()
    row.string('i18nKey').notNullable()
    row.string('externalId').notNullable()
  })
  await knex.schema.createTable('FormDefinitionSchema', row => {
    row.increments('id')
    row.string('jsonSchemaFile').notNullable()
  })
  await knex.schema.createTable('FormDefinition', row => {
    row.increments('id')
    row.integer('formTypeId').unsigned().index().references('id').inTable('FormType').onDelete('SET NULL')
    row.integer('partnerId').unsigned().notNullable().index().references('id').inTable('Partner')

    row.integer('diseaseId').unsigned().notNullable().index().references('id').inTable('Disease')

    row.integer('order').notNullable().default(0)
    row.integer('assayId').unsigned().nullable().index().references('id').inTable('Assay')
    row.string('title').notNullable()
    row.string('i18nKeyTitle').notNullable()
    row.string('subTitle').nullable()
    row.string('i18nKeySubTitle').nullable()
    row.string('description').nullable()
    row.string('i18nKeyDescription').nullable()
    row.string('externalId').notNullable()
    row.integer('formDefinitionSchemaId').unsigned().index().references('id').inTable('FormDefinitionSchema')
  })
  await knex.schema.createTable('FormData', row => {
    row.increments('id')
    row.integer('resultId').unsigned().nullable().index().references('id').inTable('Result').onDelete('SET NULL')
    row.integer('caseId').unsigned().nullable().index().references('id').inTable('Case')
    row.json('data').notNullable()
  })
}

async function down(knex) {
  await knex.schema.dropTable('FormDefinition')
  await knex.schema.dropTable('FormType')
  await knex.schema.dropTable('FormDefinitionSchema')
  await knex.schema.dropTable('FormData')
}
