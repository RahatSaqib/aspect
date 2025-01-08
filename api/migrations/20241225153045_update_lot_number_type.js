exports.up = function (knex) {
  return knex.schema.alterTable('MissingInventoryLots', function (table) {
    table.string('lotNumber').alter()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('MissingInventoryLots', function (table) {
    table.integer('lotNumber').unsigned().alter()
  })
}
