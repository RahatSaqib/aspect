module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('Report', row => {
    row.increments('id')
    row.string('name').notNullable()
    row.string('description').notNullable()
    row.integer('sortOrder').notNullable()
    row.string('i18nKey').notNullable()
    row.string('externalId').notNullable()
    row.integer('partnerId').unsigned().index().references('id').inTable('Partner').onDelete('SET NULL')
    row.integer('geographyId').unsigned().index().references('id').inTable('Geography').onDelete('SET NULL')
    row.string('fileName').notNullable()
  })

  await knex.schema.createTable('ReportSheet', row => {
    row.increments('id')
    row.integer('reportId').notNullable().unsigned().index().references('id').inTable('Report').onDelete('CASCADE')
    row.integer('sortOrder').notNullable()
    row.string('moduleName').notNullable()
    row.string('functionName').notNullable()
    row.string('query')
  })
}

async function down(knex) {
  await knex.schema.dropTable('ReportSheet')
  await knex.schema.dropTable('Report')
}
