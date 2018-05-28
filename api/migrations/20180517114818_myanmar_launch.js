module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Partner', x => {
    x.integer('dueDaysInventoryStockout')
    x.integer('dueDaysInventoryStockExpiring')
  })

  await knex.schema.createTable('FactInventoryConsumptionRate', x => {
    x
      .integer('siteId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Site')
    x
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Consumable')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    x.float('rate').notNullable()
    x.dateTime('updatedOn').notNullable()
    x.primary(['siteId', 'consumableId', 'days'])
  })
}
async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.table('Partner', x => {
    x.dropColumns('dueDaysInventoryStockout', 'dueDaysInventoryStockExpiring')
  })

  await knex.schema.dropTableIfExists('FactInventoryConsumptionRate')

  await knex.raw('SET foreign_key_checks = 1')
}
