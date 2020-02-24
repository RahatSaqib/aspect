module.exports = require('../src/db').migration(up, down)
const { updateReportableInResultCategoryAssay } = require('../seeds/utils')

async function up(knex) {
  await knex.schema.alterTable('ResultCategoryAssay ', d => {
    d.boolean('reportable')
      .notNullable()
      .defaultTo(1)
      .after('requiresTreatment')
  })

  // update some records to 0, when run migration scripts at
  // RTM without recreating db to update already existing data
  await updateReportableInResultCategoryAssay(knex)
}

async function down(knex) {
  await knex.schema.alterTable('ResultCategoryAssay ', x => {
    x.dropColumns('reportable')
  })
}
