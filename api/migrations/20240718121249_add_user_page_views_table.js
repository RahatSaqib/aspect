exports.up = function (knex) {
  return knex.schema.createTable('UserPageViews', function (table) {
    table.increments('id').primary()
    table.integer('personId').unsigned().notNullable()
    table.string('timeframe', 10).notNullable()
    table.integer('count').defaultTo(1).notNullable()
    table.foreign('personId').references('id').inTable('Person').onDelete('CASCADE')
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('UserPageViews')
}
