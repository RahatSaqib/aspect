async function up(knex) {
  await knex.schema.alterTable('deviceoperation', tbl => {
    tbl.specificType('hash', 'CHAR(32) DEFAULT NULL').unique()
  })
}

async function down(knex) {
  await knex.schema.alterTable('deviceoperation', tbl => {
    tbl.dropColumn('hash')
  })
}
module.exports = require('../src/db').migration(up, down)
