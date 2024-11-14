exports.up = function (knex) {
  return knex.schema.createTable('Instrument', function (table) {
    table.increments('id').primary()
    table.integer('deviceId').unsigned().notNullable()
    table.integer('instrumentSerial').unsigned().notNullable()
    table.integer('moduleSerial').notNullable()
    table.string('moduleName', 5).collate('utf8mb4_unicode_ci').nullable()
    table.datetime('start').notNullable()
    table.datetime('end').nullable()
    table.foreign('deviceId').references('Device.id')

    table.unique(['deviceId', 'instrumentSerial', 'moduleSerial'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('Instrument')
}
