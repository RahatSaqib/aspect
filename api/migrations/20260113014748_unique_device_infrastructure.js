const { addAuditFieldsNullable } = require('./utils')

exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('Instrument').then(() =>
    knex.schema.createTable('Instrument', instrumentTable => {
      instrumentTable.increments('id').primary()
      instrumentTable.integer('deviceId').unsigned().notNullable().references('id').inTable('Device')
      instrumentTable.string('serial', 30).nullable()
      instrumentTable.string('macAddress', 17).nullable()
      addAuditFieldsNullable(instrumentTable)
    })
  )

  await knex.schema.alterTable('Device', table => {
    table.integer('deviceApiKeyId').unsigned().nullable().references('id').inTable('DeviceApiKey')
  })

  await knex.schema.alterTable('Result', table => {
    table.integer('deviceApiKeyId').unsigned().nullable().references('id').inTable('DeviceApiKey')
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTable('Instrument')
  await knex.schema.alterTable('Device', table => {
    table.dropForeign('deviceApiKeyId')
    table.dropColumn('deviceApiKeyId')
  })
  await knex.schema.alterTable('Result', table => {
    table.dropForeign('deviceApiKeyId')
    table.dropColumn('deviceApiKeyId')
  })
}
