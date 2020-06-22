module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('AssayType', assayType => {
    assayType.string('externalId')
  })
  await knex('AssayType').update({ externalId: knex.raw('??', ['i18nKey']) })

  await knex.schema.alterTable('AssayType', assayType => {
    assayType.string('externalId').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('AssayType', assayType => {
    assayType.dropColumn('externalId')
  })
}
