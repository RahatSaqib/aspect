module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('InventoryItem', table => {
    table.dropColumn('gxAlertInventoryLocationId')
    table.dateTime('reconciliationStartDate').after('expiresOn')
  })
  await knex.schema.table('InventoryLog', table => {
    table.dropColumn('operation')
    table.dropColumn('gxAlertInventoryLogId')
    table.float('quantityOnHandAfter').nullable(false).defaultTo(0).after('quantity')
    table.dropColumn('adjustedTo')
    table.dropColumn('effectiveDate')
    table.renameColumn('adjustedFrom', 'transactionDate')
    table.renameColumn('reconcilationAdjustment', 'adjustmentStrategy')
    table.renameColumn('reconcilationStrategy', 'consumableStrategy')
  })
}

async function down(knex) {
  await knex.schema.table('InventoryItem', table => {
    table.integer('gxAlertInventoryLocationId').nullable()
    table.dropColumn('reconciliationStartDate')
  })
  await knex.schema.table('InventoryLog', table => {
    table.string('operation', 50)
    table.integer('gxAlertInventoryLogId').nullable()
    table.dropColumn('quantityOnHandAfter')
    table.dateTime('adjustedTo')
    table.dateTime('effectiveDate')
    table.renameColumn('transactionDate', 'adjustedFrom')
    table.renameColumn('adjustmentStrategy', 'reconcilationAdjustment')
    table.renameColumn('consumableStrategy', 'reconcilationStrategy')
  })
}
