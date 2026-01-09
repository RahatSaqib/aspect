const { addAuditFieldsNullable } = require('./utils')

exports.up = function (knex) {
  return knex.schema.dropTableIfExists('Instrument').then(() =>
    knex.schema.createTable('Instrument', instrumentTable => {
      instrumentTable.increments('id').primary()
      instrumentTable.integer('deviceId').unsigned().notNullable().references('id').inTable('Device')
      instrumentTable.string('serial', 30).nullable()
      instrumentTable.string('macAddress', 17).nullable()
      addAuditFieldsNullable(instrumentTable)
    })
  )
}

exports.down = function (knex) {
  return knex.schema.dropTable('Instrument')
}
