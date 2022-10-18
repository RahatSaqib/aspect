module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex('AssayType').where({ externalId: 'assayTypeMtbXdr' }).update({ abbreviation: 'XDR' })

  await knex('AssayType').where({ externalId: 'genoTypeTestStrip' }).update({ abbreviation: 'GTS' })

  // the previous two should catch all that are > 3 characters, but just in case:
  await knex('AssayType').whereRaw('LENGTH(abbreviation) > 3').update('abbreviation', knex.raw('LEFT(abbreviation, 3)'))

  await knex.schema.alterTable('AssayType', tbl => {
    tbl.string('abbreviation', 3).alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('AssayType', tbl => {
    tbl.string('abbreviation', 255).alter()
  })

  await knex('AssayType').where({ externalId: 'assayTypeMtbXdr' }).update({ abbreviation: 'MTB/XDR' })

  await knex('AssayType').where({ externalId: 'genoTypeTestStrip' }).update({ abbreviation: 'GTTS' })
}
