module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.index('startedOn')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropIndex('startedOn')
  })
}
