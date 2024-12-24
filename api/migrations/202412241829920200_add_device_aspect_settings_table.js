exports.up = function (knex) {
  return knex.schema.createTable('DeviceAspectSettings', function (table) {
    table.increments('id').primary()
    table.integer('deviceId').unsigned().notNullable()
    table.foreign('deviceId').references('Device.id')
    table.boolean('enableCustomFieldParsing').notNullable()
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('DeviceAspectSettings')
}
