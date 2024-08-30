exports.up = function (knex) {
  return knex.schema.createTable('UserReportRequest', function (table) {
    // Primary Key
    table.increments('id').primary()

    // Foreign Key to the Users table
    table.integer('userId').unsigned().notNullable()
    table.foreign('userId').references('id').inTable('User').onDelete('CASCADE')

    table.integer('requestCount').unsigned().index()

    // Foreign Key to the AsyncReport table
    table.integer('asyncReportId').unsigned().notNullable()
    table.foreign('asyncReportId').references('id').inTable('AsyncReport').onDelete('CASCADE')

    table.timestamp('createdOn').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('UserReportRequest')
}
