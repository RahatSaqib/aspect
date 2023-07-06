exports.up = async function (knex) {
  await knex.schema.alterTable('InventoryItem', ii => {
    ii.integer('gxAlertInventoryLocationId').nullable()
  })
  await knex.schema.alterTable('InventoryLog', il => {
    il.integer('gxAlertInventoryLogId').nullable()
  })
  await knex.schema.alterTable('ConsumableReason', cr => {
    cr.string('externalId', 25).notNullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('InventoryLog', il => {
    il.dropColumn('gxAlertInventoryLogId')
  })
  await knex.schema.alterTable('InventoryItem', ii => {
    ii.dropColumn('gxAlertInventoryLocationId')
  })
  await knex.schema.alterTable('ConsumableReason', cr => {
    cr.dropColumn('externalId')
  })
}
