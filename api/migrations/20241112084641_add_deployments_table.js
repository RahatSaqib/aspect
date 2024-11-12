const { databaseTableNames } = require('./utils/databaseTableNames')

exports.up = function (knex) {
  return knex.schema.createTable(databaseTableNames.DEPLOYMENT, function (table) {
    table.increments('id').primary()
    table.string('name').nullable()
    table.integer('siteId').unsigned().nullable()
    table.integer('deviceId').unsigned().notNullable()
    table.datetime('start').notNullable()
    table.datetime('end').nullable()
    table.enum('status', ['pending', 'active', 'inactive']).defaultTo('pending').notNullable()
    table.foreign('deviceId').references('Device.id')
    table.foreign('siteId').references('Site.id')

    table.unique(['siteId', 'deviceId'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable(databaseTableNames.DEPLOYMENT)
}
