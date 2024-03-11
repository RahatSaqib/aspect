exports.up = function (knex) {
  return knex.schema.alterTable('DeviceOperation', function (table) {
    table.uuid('guid')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('DeviceOperation', function (table) {
    table.dropColumn('guid')
  })
}

exports.config = { transaction: true }
