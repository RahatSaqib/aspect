module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('RefreshToken', table => {
    table
      .string('clientType', 50)
      .notNullable()
      .defaultTo('Web')
  })
}
async function down(knex) {
  await knex.schema.alterTable('RefreshToken', table => {
    table.dropColumn('clientType')
  })
}
