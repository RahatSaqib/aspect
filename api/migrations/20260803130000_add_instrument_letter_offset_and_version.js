const { addAuditoryTriggers } = require('./utils/addAuditTriggers')

module.exports = require('../src/db').migration(up, down)

/**
 * GxConnect reports `letter_offset` and `version` for every instrument in its daily details.
 * The letter offset is what turns a module site name into the letter GxConnect displays, so
 * it is needed to match modules across instruments of the same installation.
 */
async function up(knex) {
  await knex.schema.alterTable('Instrument', table => {
    table.integer('letterOffset').nullable().after('macAddress')
    table.integer('version').nullable().after('letterOffset')
  })

  await knex.schema.alterTable('Instrument_AUDIT', table => {
    table.integer('letterOffset').nullable()
    table.integer('version').nullable()
  })

  await addAuditoryTriggers(knex, 'Instrument', 'Instrument_AUDIT')
}

async function down(knex) {
  await knex.schema.alterTable('Instrument', table => {
    table.dropColumn('letterOffset')
    table.dropColumn('version')
  })

  await knex.schema.alterTable('Instrument_AUDIT', table => {
    table.dropColumn('letterOffset')
    table.dropColumn('version')
  })

  await addAuditoryTriggers(knex, 'Instrument', 'Instrument_AUDIT')
}
