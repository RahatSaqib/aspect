module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('Case', row => {
    row.increments('id')
    row.string('externalId').notNullable()
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
