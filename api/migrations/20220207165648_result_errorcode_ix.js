module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.string('errorCode', 50).index().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropIndex('errorCode')
    tbl.string('errorCode').alter()
  })
}
