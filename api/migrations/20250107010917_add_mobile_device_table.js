exports.up = function (knex) {
  return knex.schema.createTable('MobileDevice', function (table) {
    table.increments('id').primary()
    table.string('deviceIdentifier', 3).notNullable().unique().index()
    table.string('deviceCode', 100).nullable().index()
    table.dateTime('createdOn').nullable().index()
    table.integer('createdBy').unsigned().nullable()
    table.foreign('createdBy').references('id').inTable('Person')
    table.boolean('active').defaultTo(false).notNullable().index()

    // Add index for efficient lookups
    table.index(['deviceCode', 'active'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('MobileDevice')
}
