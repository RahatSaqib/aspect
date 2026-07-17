module.exports = require('../src/db').migration(up, down)

// Schema only: seeds own the data (upsert_reports writes every report's parameters
// and runs on the same deploy, right after migrations).
async function up(knex) {
  await knex.schema.alterTable('Report', table => {
    table.json('parameters').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Report', table => {
    table.dropColumn('parameters')
  })
}
