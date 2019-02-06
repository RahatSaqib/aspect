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
  createdOnFieldTables.forEach(async element => {
    await knex.schema.alterTable(element, table => {
      table
        .datetime('createdOn')
        .notNullable()
        .defaultTo(knex.fn.now())
        .alter()
    })
  })
  updatedOnFieldTables.forEach(async element => {
    await knex.schema.alterTable(element, table => {
      table
        .datetime('updatedOn')
        .notNullable()
        .defaultTo(knex.fn.now())
        .alter()
    })
  })
}
async function down(knex) {
  createdOnFieldTables.forEach(async element => {
    await knex.schema.alterTable(element, table => {
      table
        .datetime('createdOn')
        .nullable()
        .alter()
    })
  })
  updatedOnFieldTables.forEach(async element => {
    await knex.schema.alterTable(element, table => {
      table
        .datetime('updatedOn')
        .nullable()
        .alter()
    })
  })
}
/*
async function up(knex) {
  // nothing to do
}
async function down(knex) {
  // nothing to do
}


*/
