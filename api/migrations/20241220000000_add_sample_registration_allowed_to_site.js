exports.up = function (knex) {
  return knex.schema.alterTable('Site', function (table) {
    table.boolean('sampleRegistrationAllowed').defaultTo(false).notNullable()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Site', function (table) {
    table.dropColumn('sampleRegistrationAllowed')
  })
}
