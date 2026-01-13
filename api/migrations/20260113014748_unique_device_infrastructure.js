const { addAuditFieldsNullable } = require('./utils')

exports.up = function (knex) {
  return Promise.all([
    knex.schema
      .dropTableIfExists('Instrument')
      .then(() =>
        knex.schema.createTable('Instrument', instrumentTable => {
          instrumentTable.increments('id').primary()
          instrumentTable.integer('deviceId').unsigned().notNullable().references('id').inTable('Device')
          instrumentTable.string('serial', 30).nullable()
          instrumentTable.string('macAddress', 17).nullable()
          addAuditFieldsNullable(instrumentTable)
        })
      )
      .then(() =>
        knex.schema.alterTable('Device', deviceTable => {
          deviceTable.string('deviceApiKey', 20).nullable()
        })
      ),
  ])
}

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTable('Instrument'),
    knex.schema.alterTable('Device', deviceTable => {
      deviceTable.dropColumn('deviceApiKey')
    }),
  ])
}
