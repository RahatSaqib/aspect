module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('ResultCategoryGroup', tblResultCategoryGroup => {
    tblResultCategoryGroup.increments('id')
    tblResultCategoryGroup.string('externalId').notNullable().index().unique()
    tblResultCategoryGroup.string('name')
    tblResultCategoryGroup.string('i18nKey')
    tblResultCategoryGroup
      .integer('resultCategory1Id')
      .unsigned()
      .nullable()
      .index()
      .references('id')
      .inTable('ResultCategory')
    tblResultCategoryGroup
      .integer('resultCategory2Id')
      .unsigned()
      .nullable()
      .index()
      .references('id')
      .inTable('ResultCategory')
    tblResultCategoryGroup.integer('assayId').unsigned().notNullable().index().references('id').inTable('Assay')
    tblResultCategoryGroup.unique(['resultCategory1Id', 'resultCategory2Id', 'assayId'], 'rc1Id_rc2Id_assayId')
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('ResultCategoryGroup')
}
