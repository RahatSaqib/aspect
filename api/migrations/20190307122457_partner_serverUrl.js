module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Partner', table => {
    table.string('serverUrl').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', table => {
    table.dropColumn('serverUrl')
  })
}
