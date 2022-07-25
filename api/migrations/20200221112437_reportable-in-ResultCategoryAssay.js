module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('ResultCategoryAssay ', d => {
    d.boolean('reportable').notNullable().defaultTo(1).after('requiresTreatment')
  })
}

async function down(knex) {
  await knex.schema.alterTable('ResultCategoryAssay ', x => {
    x.dropColumns('reportable')
  })
}
