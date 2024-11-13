exports.up = function (knex) {
  return knex.schema.createTable('Deployment', function (table) {
    table.increments('id').primary()
    table.integer('siteId').unsigned().nullable()
    table.integer('deviceId').unsigned().notNullable()
    table.datetime('start').notNullable()
    table.datetime('end').nullable()
    table.foreign('deviceId').references('Device.id')
    table.foreign('siteId').references('Site.id')

    table.unique(['siteId', 'deviceId'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('Deployment')
}
