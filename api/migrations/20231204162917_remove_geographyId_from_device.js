exports.up = function (knex) {
  return knex.schema.alterTable('Device', function (table) {
    table.dropColumn('geographyId')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Device', function (table) {
    table.integer('geographyId').unsigned().references('id').inTable('Geography')
  })
}
