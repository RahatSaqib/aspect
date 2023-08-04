async function up(knex) {
  await knex.schema.raw(`ALTER TABLE Result ADD INDEX result_consumableserial_index (consumableSerial)`)
}

async function down(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropIndex('', 'result_consumableserial_index')
  })
}
module.exports = require('../src/db').migration(up, down)
