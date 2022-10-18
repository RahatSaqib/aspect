module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceApproval', tbl => {
    tbl.index('token')
  })
  await knex.schema.alterTable('Consumable', tbl => {
    tbl.string('manufacturer', 100).index().alter()
  })
  await knex.schema.alterTable('InventoryLog', tbl => {
    tbl.index('createdOn')
  })
  await knex.schema.alterTable('ConsumableReason', tbl => {
    tbl.index('i18nkey')
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceApproval', tbl => {
    tbl.dropIndex('token')
  })
  await knex.schema.alterTable('Consumable', tbl => {
    tbl.dropIndex('manufacturer')
  })
  await knex.schema.alterTable('Consumable', tbl => {
    tbl.text('manufacturer').alter()
  })
  await knex.schema.alterTable('InventoryLog', tbl => {
    tbl.dropIndex('createdOn')
  })
  await knex.schema.alterTable('ConsumableReason', tbl => {
    tbl.dropIndex('i18nkey')
  })
}
