exports.up = function (knex) {
  return knex.schema.alterTable('Result', function (table) {
    table.dropForeign(['geographyId'])
    table.dropColumn('geographyId')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Result', function (table) {
    table.integer('geographyId').unsigned().references('id').inTable('Geography')
  })
}
