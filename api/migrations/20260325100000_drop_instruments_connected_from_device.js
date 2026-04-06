module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', table => {
    table.dropColumn('instrumentsConnected')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', table => {
    table.integer('instrumentsConnected').defaultTo(1)
  })
}
