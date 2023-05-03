async function up(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.bool('isDefault').notNullable().default(false)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.dropColumn('isDefault')
  })
}
module.exports = require('../src/db').migration(up, down)
