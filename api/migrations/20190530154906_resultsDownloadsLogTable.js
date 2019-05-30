module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('resultDownloadLog', table => {
    table.increments('id')
    table
      .string('method')
      .notNullable()
      .defaultTo('app')
    table
      .timestamp('createdOn')
      .notNullable()
      .defaultTo(knex.fn.now())
    table
      .integer('createdBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')

    table
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
  })
}
async function down(knex) {
  await knex.schema.dropTable('RefreshToken', refreshToken => {
    refreshToken.dropColumn('updatedOn')
  })
}
