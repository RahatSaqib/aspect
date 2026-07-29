module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', tbl => {
    tbl.dropColumn('lastInstrumentSerial')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', tbl => {
    tbl.string('lastInstrumentSerial')
  })
}
