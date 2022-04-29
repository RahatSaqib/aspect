module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.boolean('implementsReporterApp').default(true)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.dropColumn('implementsReporterApp')
  })
}
