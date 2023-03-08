async function up(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.bool('excluded').notNullable().default(false)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropColumn('excluded')
  })
}
module.exports = require('../src/db').migration(up, down)
