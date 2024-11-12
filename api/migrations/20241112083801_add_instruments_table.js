const { databaseTableNames } = require('./utils/databaseTableNames')

exports.up = function (knex) {
  return knex.schema.createTable(databaseTableNames.INSTRUMENT, function (table) {
    table.increments('id').primary()
    table.integer('deviceId').unsigned().notNullable()
    table.integer('instrumentSerial').unsigned().notNullable()
    table.integer('moduleSerial').notNullable() // Shall we keep it nullable? Is there a possibility of this being empty in the results? I think yes, right?
    table.string('moduleName', 5).collate('utf8mb4_unicode_ci').nullable()
    table.datetime('start').notNullable()
    table.datetime('end').nullable()
    // Will be used to determine if the instrument is still in use or it is retired
    table.enum('status', ['active', 'inactive', 'retired']).defaultTo('active').notNullable()
    table.foreign('deviceId').references('Device.id')
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable(databaseTableNames.INSTRUMENT)
}
