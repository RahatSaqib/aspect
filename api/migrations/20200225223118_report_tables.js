module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('Report', row => {
    row.increments('id')
    row.string('name').notNullable()
    row.string('description').notNullable()
    row.integer('orderNumber').notNullable()
    row.string('i18nKey').notNullable()
    row.string('externalId').notNullable()
    row
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .onDelete('SET NULL')
    row
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
      .onDelete('SET NULL')
    row.string('fileNamePrefix')
  })

  await knex.schema.createTable('ReportSheet', row => {
    row.increments('id')
    row.string('sheetName')
    row.string('title').notNullable()
    row
      .integer('reportId')
      .notNullable()
      .unsigned()
      .index()
      .references('id')
      .inTable('Report')
      .onDelete('CASCADE')
    row.string('endpoint').notNullable()
    row.string('query')
  })
}

async function down(knex) {
  await knex.schema.dropTable('ReportSheet')
  await knex.schema.dropTable('Report')
}
