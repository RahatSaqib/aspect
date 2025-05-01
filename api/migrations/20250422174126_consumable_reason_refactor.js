module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex('InventoryLog')
    .join('ConsumableReason', 'InventoryLog.consumableReasonId', 'ConsumableReason.id')
    .where('ConsumableReason.decrease', 1)
    .update({ quantity: knex.raw('quantity * -1') })

  await knex.schema.table('ConsumableReason', table => {
    table.integer('userSelectable').defaultTo(0).notNullable()
    table.enum('effectOnStock', ['increase', 'decrease', 'resetToValue']).notNullable().defaultTo('increase')
    table.dropColumn('decrease')
    table.dropColumn('reset')
  })
}

async function down(knex) {
  await knex.schema.table('ConsumableReason', table => {
    table.dropColumn('userSelectable')
    table.dropColumn('effectOnStock')
    table.boolean('decrease').notNullable().defaultTo(0)
    table.boolean('reset').notNullable().defaultTo(0)
  })
}
