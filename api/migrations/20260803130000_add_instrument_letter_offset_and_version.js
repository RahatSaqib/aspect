const { addAuditoryTriggers } = require('./utils/addAuditTriggers')

module.exports = require('../src/db').migration(up, down)

/**
 * GxConnect reports `letter_offset` and `version` for every instrument in its daily details.
 * The offset gets converted to a human-readable `letter` before persisting.
 */
async function up(knex) {
  await knex.schema.alterTable('Instrument', table => {
    table.string('letter', 1).nullable().after('macAddress')
    table.integer('version').nullable().after('letter')
  })

  await knex.schema.alterTable('Instrument_AUDIT', table => {
    table.string('letter', 1).nullable()
    table.integer('version').nullable()
  })

  await addAuditoryTriggers(knex, 'Instrument', 'Instrument_AUDIT')
}

async function down(knex) {
  await knex.schema.alterTable('Instrument', table => {
    table.dropColumn('letter')
    table.dropColumn('version')
  })

  await knex.schema.alterTable('Instrument_AUDIT', table => {
    table.dropColumn('letter')
    table.dropColumn('version')
  })

  await addAuditoryTriggers(knex, 'Instrument', 'Instrument_AUDIT')
}
