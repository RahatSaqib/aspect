module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('MissingInventoryLots', table => {
    table.integer('consumableId').unsigned().nullable()
  })
  await knex('MissingInventoryLots as mil')
    .join('Result as r', 'mil.resultId', 'r.id')
    .join('ConsumableAssay as ca', 'ca.assayId', 'r.assayId')
    .update('mil.consumableId', knex.raw('ca.consumableId'))
  await knex.schema.alterTable('MissingInventoryLots', table => {
    table.integer('consumableId').unsigned().notNullable().references('id').inTable('Consumable').alter()
  })
}

async function down(knex) {
  await knex.schema.table('MissingInventoryLots', table => {
    table.dropForeign('consumableId')
    table.dropColumn('consumableId')
  })
}
