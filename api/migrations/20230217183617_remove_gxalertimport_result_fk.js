async function up(knex) {
  await knex.schema.alterTable('GxAlertImport', tbl => {
    tbl.dropForeign('aspectResultId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('GxAlertImport', tbl => {
    tbl.foreign('aspectResultId').references('Result.id')
  })
}
module.exports = require('../src/db').migration(up, down)
