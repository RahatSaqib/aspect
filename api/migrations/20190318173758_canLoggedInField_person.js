module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Person', table => {
    table.boolean('canLogIn').defaultTo(0)
  })
}
async function down(knex) {
  await knex.schema.alterTable('Person', table => {
    table.dropColumn('canLogIn')
  })
}
