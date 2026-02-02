exports.up = function (knex) {
  return knex.schema.alterTable('Result', table => {
    table.integer('reportableSiteId').unsigned().nullable().alter()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Result', table => {
    table.integer('reportableSiteId').unsigned().notNullable().alter()
  })
}
