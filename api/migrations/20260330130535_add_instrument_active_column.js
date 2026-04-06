const { addAuditoryTriggers } = require('./utils/addAuditTriggers')

exports.up = async function (knex) {
  await knex.schema.alterTable('Instrument', table => {
    table.boolean('active').after('macAddress').notNullable()
  })

  await knex.schema.alterTable('Instrument_AUDIT', table => {
    table.boolean('active').nullable()
  })

  await addAuditoryTriggers(knex, 'Instrument', 'Instrument_AUDIT')
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Instrument', table => {
    table.dropColumn('active')
  })

  await knex.schema.alterTable('Instrument_AUDIT', table => {
    table.dropColumn('active')
  })

  await addAuditoryTriggers(knex, 'Instrument', 'Instrument_AUDIT')
}
