module.exports = require('../src/db').migration(up, down)

const createdOnFieldTables = [
  'AuditLog',
  'DeviceLog',
  'DeviceOperation',
  'DeviceSiteHistory',
  'DeviceStatusLog',
  'InventoryLog',
  'IssueEvent',
  'IssueStatusLog',
  'Notification',
  'RefreshToken',
  'ResultQualityControlLog',
  'ResultWorkflowLog',
  'User',
  'AlertMessage',
  'AlertTemplate',
  'Device',
  'DeviceApiKey',
  'DeviceSim',
  'EmailMessage',
  'EmailTemplate',
  'FileReference',
  'InventoryItem',
  'Issue',
  'IssueEscalationTrigger',
  'IssueEventTrigger',
  'IssueResolutionTrigger',
  'NotificationType',
  'Person',
  'Result',
  'Site',
  'SmsMessage',
  'SmsTemplate',
  'WebhookMessage',
  'WebhookTemplate',
]

const updatedOnFieldTables = [
  'FactDeviceFlag',
  'FactInventoryConsumptionRate',
  'AlertMessage',
  'AlertTemplate',
  'Device',
  'DeviceApiKey',
  'DeviceSim',
  'EmailMessage',
  'EmailTemplate',
  'FileReference',
  'InventoryItem',
  'Issue',
  'IssueEscalationTrigger',
  'IssueEventTrigger',
  'IssueResolutionTrigger',
  'NotificationType',
  'Person',
  'Result',
  'Site',
  'SmsMessage',
  'SmsTemplate',
  'WebhookMessage',
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
