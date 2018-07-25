module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Issue', issue => {
    issue
      .integer('consumableId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Consumable')
  })

  await knex.schema.table('Partner', partner => {
    // TODO: Migrate and seed deviceLogHistoryDays, autoAcknowledgeOlderThanDays, numberToLeaveUnacknowledged,
    // maxDaysDeviceOffline, maxDaysDeviceNoResults, dueDaysInventoryStockout and dueDaysInventoryStockExpiring
    // to this JSON field
    partner.specificType('partnerSettings', 'JSON')
  })

  await knex.schema.table('JobFunction', jobFunction => {
    jobFunction
      .boolean('isAdmin')
      .notNullable()
      .defaultTo(0)
  })

  await knex.schema.table('AlertTemplate', alertTemplate => {
    alertTemplate.specificType('templateSettings', 'JSON')
  })
}

async function down(knex) {
  await knex.schema.table('Issue', issue => {
    issue.dropColumns('consumableId')
  })

  await knex.schema.table('Partner', issue => {
    issue.dropColumns('partnerSettings')
  })

  await knex.schema.table('JobFunction', issue => {
    issue.dropColumns('isAdmin')
  })

  await knex.schema.table('AlertTemplate', issue => {
    issue.dropColumns('templateSettings')
  })
}
