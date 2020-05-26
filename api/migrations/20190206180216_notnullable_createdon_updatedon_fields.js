const Promise = require('bluebird')

module.exports = require('../src/db').migration(up, down)

const createdOnFieldTables = [
  'AlertTemplate',
  'Device',
  'DeviceOperation',
  'DeviceSiteHistory',
  'DeviceStatusLog',
  'EmailTemplate',
  'FileReference',
  'InventoryItem',
  'InventoryLog',
  'Result',
  'ResultQualityControlLog',
  'ResultWorkflowLog',
  'Site',
  'SmsTemplate',
  'WebhookTemplate',
]

const updatedOnFieldTables = [
  'AlertTemplate',
  'Device',
  'EmailTemplate',
  'FileReference',
  'InventoryItem',
  'Result',
  'Site',
  'SmsTemplate',
  'WebhookTemplate',
]

async function up(knex) {
  await Promise.each(createdOnFieldTables, element =>
    knex.schema.alterTable(element, table => {
      table.datetime('createdOn').notNullable().defaultTo(knex.fn.now()).alter()
    })
  )

  await Promise.each(updatedOnFieldTables, element =>
    knex.schema.alterTable(element, table => {
      table.datetime('updatedOn').notNullable().defaultTo(knex.fn.now()).alter()
    })
  )
}

async function down(knex) {
  await Promise.each(createdOnFieldTables, element =>
    knex.schema.alterTable(element, table => {
      table.datetime('createdOn').nullable().alter()
    })
  )

  await Promise.each(updatedOnFieldTables, element =>
    knex.schema.alterTable(element, table => {
      table.datetime('updatedOn').nullable().alter()
    })
  )
}
