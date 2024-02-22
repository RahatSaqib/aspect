exports.up = function (knex) {
  return knex.schema.alterTable('Device', function (table) {
    table.string('stickerInstrumentSerial', 32)
    table.string('instrumentModel', 32)
    table.string('softwareType', 32)
    table.bool('isDaisyChained').notNullable().default(false)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Device', function (table) {
    table.dropColumn('stickerInstrumentSerial')
    table.dropColumn('instrumentModel')
    table.dropColumn('softwareType')
    table.dropColumn('isDaisyChained')
  })
}

exports.config = { transaction: true }
