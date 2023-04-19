async function up(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.string('excludePattern', 70)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.dropColumn('excludePattern')
  })
}
module.exports = require('../src/db').migration(up, down)
