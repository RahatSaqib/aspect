module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  /* Adding TZ table just for querying purpose */
  await knex.schema.createTable('ResultCategoryGroup', tblResultCategoryGroup => {
    tblResultCategoryGroup.increments('id')
    tblResultCategoryGroup.string('externalId')
    tblResultCategoryGroup.string('name')
    tblResultCategoryGroup.string('i18nKey')
      .notNullable()
      .index()
      .unique()
    tblResultCategoryGroup.integer('resultCategory1Id')
      .unsigned()
      .nullable()
      .index()
      .references('id')
      .inTable('ResultCategory')
    tblResultCategoryGroup.integer('resultCategory2Id')
      .unsigned()
      .nullable()
      .index()
      .references('id')
      .inTable('ResultCategory')
    tblResultCategoryGroup.integer('assayId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Assay')
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('ResultCategoryGroup')
}
