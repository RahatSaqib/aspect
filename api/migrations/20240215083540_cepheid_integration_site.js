exports.up = function (knex) {
  return knex.schema.alterTable('Site', function (table) {
    table.string('institutionName', 64)
    table.uuid('institutionGuid')
    table.uuid('guid')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Site', function (table) {
    table.dropColumn('institutionName')
    table.dropColumn('institutionGuid')
    table.dropColumn('guid')
  })
}

exports.config = { transaction: true }
