exports.up = function (knex) {
  return knex.schema.alterTable('Sample', function (table) {
    table.dateTime('createdOn')
    table.integer('createdBy').unsigned().index().references('id').inTable('User')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Sample', function (table) {
    table.dropColumn('createdOn')
    table.dropColumn('createdBy')
  })
}
