module.exports = require('../src/db').migration(up, down)

// TODO: Remove the following two ESLint ignore-settings when implementing migrations
/* eslint no-unused-vars: 0 */
/* eslint no-empty-function: 0 */
async function up(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.table('Partner', x => {
    x.integer('dueDaysInventoryStockout')
    x.integer('dueDaysInventoryStockExpiring')
  })

  await knex.schema.createTable('FactInventoryConsumptionRate', x => {
    x.increments('id')
    x
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Consumable')
    x
      .integer('siteId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Site')
    x.integer('days').unsigned()
    x.float('rate')
    x.dateTime('updatedOn').notNullable()
    x.unique(
      ['siteId', 'consumableId', 'days'],
      'FactInventoryConsumptionRate_unique'
    )
  })

  await knex.raw('SET foreign_key_checks = 1')
}
async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.dropTableIfExists('Partner')
  await knex.schema.dropTableIfExists('FactInventoryConsumptionRate')

  await knex.raw('SET foreign_key_checks = 1')
}
