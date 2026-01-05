exports.up = function (knex) {
  return knex.schema.alterTable('DeviceLog', function (table) {
    table.boolean('processed').notNullable().defaultTo(1).index()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('DeviceLog', function (table) {
    table.dropColumn('processed')
  })
}
