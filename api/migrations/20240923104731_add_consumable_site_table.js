exports.up = function (knex) {
  return knex.schema.createTable('SiteConsumable', function (table) {
    table.integer('siteId').unsigned().notNullable()
    table.foreign('siteId').references('id').inTable('Site').onDelete('CASCADE')
    table.integer('consumableId').unsigned().notNullable()
    table.foreign('consumableId').references('id').inTable('Consumable').onDelete('CASCADE')
    table.primary(['siteId', 'consumableId'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('SiteConsumable')
}
