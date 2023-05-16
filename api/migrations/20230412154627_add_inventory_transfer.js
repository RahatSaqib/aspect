exports.up = async function (knex) {
  await knex.schema.createTable('InventoryTransfer', table => {
    table.increments('id')
    table.integer('outcomeInventoryLogId').nullable(false).unsigned().index().references('id').inTable('InventoryLog')
    table.integer('incomeInventoryLogId').nullable(true).unsigned().index().references('id').inTable('InventoryLog')
    table.integer('tempInventoryItemId').nullable(true).unsigned().index().references('id').inTable('InventoryItem')
    table.datetime('createdOn').notNullable().defaultTo(knex.fn.now())
    table.datetime('updatedOn').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('InventoryTransfer')
}
