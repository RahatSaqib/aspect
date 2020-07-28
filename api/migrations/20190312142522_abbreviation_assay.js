module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('AssayType', table => {
    table.string('abbreviation').nullable()
  })
  await knex.schema.alterTable('Assay', table => {
    table.string('abbreviation').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('AssayType', table => {
    table.dropColumn('abbreviation')
  })
  await knex.schema.alterTable('Assay', table => {
    table.dropColumn('abbreviation')
  })
}
