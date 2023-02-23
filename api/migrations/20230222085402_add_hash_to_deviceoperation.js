async function up(knex) {
  await knex.schema.alterTable('DeviceOperation', tbl => {
    tbl.string('hash', 32).unique()
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceOperation', tbl => {
    tbl.dropColumn('hash')
  })
}
module.exports = require('../src/db').migration(up, down)
