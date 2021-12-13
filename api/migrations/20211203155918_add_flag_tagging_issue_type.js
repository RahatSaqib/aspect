module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('IssueType', tbl => {
    tbl.boolean('hasTag').default(1)
  })
}

async function down(knex) {
  await knex.schema.alterTable('IssueType', tbl => {
    tbl.dropColumn('hasTag')
  })
}
