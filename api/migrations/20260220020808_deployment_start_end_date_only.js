exports.up = function (knex) {
  return knex.schema.alterTable('Deployment', function (table) {
    table.date('start').notNullable().alter()
    table.date('end').nullable().alter()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Deployment', function (table) {
    table.datetime('start').notNullable().alter()
    table.datetime('end').nullable().alter()
  })
}
