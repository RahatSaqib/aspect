async function up(knex) {
  await knex.schema.raw(`
    ALTER TABLE Result
      ADD INDEX result_deviceId_endedOn_index (
        deviceId,
        endedOn DESC)
      `)
}

async function down(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropIndex('', 'result_deviceId_endedOn_index')
  })
}
module.exports = require('../src/db').migration(up, down)
