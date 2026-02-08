const { addAuditFieldsNullable } = require('./utils')
const { addAuditoryTriggers } = require('./utils/addAuditTriggers')

exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('Instrument')

  await knex.schema.createTable('Instrument', instrumentTable => {
    instrumentTable.increments('id').primary()
    instrumentTable.integer('deviceId').unsigned().notNullable().references('id').inTable('Device')
    instrumentTable.string('serial', 30).nullable()
    instrumentTable.string('macAddress', 17).nullable()
    addAuditFieldsNullable(instrumentTable)
  })

  await knex.schema.createTable('Instrument_AUDIT', function (table) {
    table.integer('id').nullable()
    table.integer('deviceId').unsigned().nullable()
    table.string('serial', 30).nullable()
    table.string('macAddress', 17).nullable()
    table.integer('createdBy').nullable()
    table.dateTime('createdOn').nullable()
    table.integer('updatedBy').nullable()
    table.dateTime('updatedOn').nullable()
    table.dateTime('auditTime').nullable().defaultTo(knex.fn.now())
  })

  await addAuditoryTriggers(knex, 'Instrument', 'Instrument_AUDIT')

  await knex.schema.alterTable('Device', table => {
    table.integer('deviceApiKeyId').unsigned().nullable().references('id').inTable('DeviceApiKey')
  })

  await knex.schema.alterTable('Result', table => {
    table.integer('deviceApiKeyId').unsigned().nullable().references('id').inTable('DeviceApiKey')
  })

  await knex.schema.alterTable('Deployment', table => {
    addAuditFieldsNullable(table)
    table.dropUnique(['siteId', 'deviceId'])
    table.unique(['deviceId', 'start'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('Instrument_AUDIT')
  await knex.schema.dropTable('Instrument')
  await knex.schema.alterTable('Device', table => {
    table.dropForeign('deviceApiKeyId')
    table.dropColumn('deviceApiKeyId')
  })

  await knex.schema.alterTable('Result', table => {
    table.dropForeign('deviceApiKeyId')
    table.dropColumn('deviceApiKeyId')
  })

  await knex.schema.alterTable('Deployment', table => {
    table.dropUnique(['deviceId', 'start'])
    table.unique(['siteId', 'deviceId'])
    table.dropColumn('createdBy')
    table.dropColumn('createdOn')
    table.dropColumn('updatedBy')
    table.dropColumn('updatedOn')
  })
}
