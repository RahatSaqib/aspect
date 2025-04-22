module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('ConsumableReason', table => {
    table.integer('userSelectable').defaultTo(0).notNullable() // Add userSelectable field
    table.renameColumn('decrease', 'increaseDecrease') // Rename decrease to increaseDecrease
  })
}

async function down(knex) {
  await knex.schema.table('ConsumableReason', table => {
    table.dropColumn('userSelectable') // Remove userSelectable field
    table.renameColumn('increaseDecrease', 'decrease') // Rename increaseDecrease back to decrease
  })
}
