module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('ResultCategoryAssay', tbl => {
    tbl.index('requiresTreatment')
    tbl.index('reportable')
  })
}

async function down(knex) {
  await knex.schema.alterTable('ResultCategoryAssay', tbl => {
    tbl.dropIndex('requiresTreatment')
    tbl.dropIndex('reportable')
  })
}
