exports.up = function (knex) {
  return knex.schema.alterTable('Deployment', function (table) {
    // start is nullable: the first (oldest) deployment has no start date (covers "from the beginning")
    table.date('start').nullable().alter()
    table.date('end').nullable().alter()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Deployment', function (table) {
    table.datetime('start').notNullable().alter()
    table.datetime('end').nullable().alter()
  })
}
