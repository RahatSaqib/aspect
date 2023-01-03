module.exports = require('../src/db').migration(up, down)

// const { addCreateFieldsNullable, addUpdateFieldsNullable } = require('./utils/index')

async function up(knex) {
  await knex.schema.createTable('GxAlertImport', table => {
    table.increments('id')
    table.string('fileFullPath').notNullable()
    table.integer('gxAlertTestId').unsigned().index().notNullable()
    table.integer('aspectResultId').unsigned().index().references('id').inTable('Result')
    table.string('status')
    table.string('error')

    table.dateTime('updatedOn')
    table.dateTime('createdOn')

    // addCreateFieldsNullable(it)
    // addUpdateFieldsNullable(it)
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('GxAlertImport')
}
