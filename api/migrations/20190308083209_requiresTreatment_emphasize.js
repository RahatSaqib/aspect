module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('ResultCategoryAssay', table => {
    table.boolean('emphasize').defaultTo(0)
    table.boolean('requiresTreatment').defaultTo(0)
  })
}
async function down(knex) {
  await knex.schema.alterTable('ResultCategoryAssay', table => {
    table.dropColumn('emphasize')
    table.dropColumn('requiresTreatment')
  })
}
