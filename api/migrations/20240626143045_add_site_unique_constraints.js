exports.up = function (knex) {
  return knex.schema.alterTable('Site', function (table) {
    table.unique('externalId')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Site', function (table) {
    table.dropUnique('externalId')
  })
}
