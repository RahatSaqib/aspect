module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('FormType', row => {
    row.increments('id')
    row.string('name').notNullable()
    row.string('i18nKey').notNullable()
    row.string('externalId').notNullable()
  })
  await knex.schema.createTable('FormDefinition', row => {
    row.increments('id')
    row.string('title').notNullable()
    row.string('subTitle').nullable()
    row.string('description').nullable()
    row
      .integer('formTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('FormType')
      .onDelete('SET NULL')
    row.string('i18nKeyTitle').notNullable()
    row.string('i18nKeySubTitle').nullable()
    row.string('i18nKeyDescription').nullable()
    row.string('externalId').notNullable()
    row
      .integer('partnerId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Partner')

    row
      .integer('diseaseId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Disease')

    row
      .integer('assayId')
      .unsigned()
      .nullable()
      .index()
      .references('id')
      .inTable('Assay')
  })
  await knex.schema.alterTable('Result', row => {
    row
      .integer('caseId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Case')
      .onDelete('SET NULL')
  })
}

async function down(knex) {
  await knex.schema.dropTable('Case')

  await knex.schema.alterTable('Result', row => {
    row.dropForeign('caseId')
    row.dropColumns('caseId')
  })
}
