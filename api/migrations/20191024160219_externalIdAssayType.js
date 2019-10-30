module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('AssayType', assayType => {
    assayType
      .string('externalId')
      .defaultTo(knex.raw('??', ['i18nKey']))
      .notNullable()
  })
}
async function down(knex) {
  await knex.schema.alterTable('AssayType', assayType => {
    assayType.dropColumn('externalId')
  })
}
