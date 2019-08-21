module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('IssueCategory', table => {
    table.string('shortName').nullable()
  })
}
async function down(knex) {
  await knex.schema.alterTable('IssueCategory', table => {
    table.dropColumn('shortName')
  })
}
