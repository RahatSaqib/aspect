module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.raw(`ALTER TABLE Result
   ADD INDEX result_partner_endedOn_index (partnerId, endedOn DESC);`)
}

async function down(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropIndex('', 'result_partner_endedOn_index')
  })
}
