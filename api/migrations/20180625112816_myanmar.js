module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  
  await knex.schema.table('Partner', x => {
    x.integer('dueDaysInventoryStockout')
    x.integer('dueDaysInventoryStockExpiring')
  })

  await knex.schema.createTable('FactInventoryConsumptionRate', x => {
    x
      .integer('siteId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Site')
    x
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Consumable')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    // for 'rate' use float - because daily rate is calculated as "totals for last 10 days with at least 1 test"/10
    x.float('rate').notNullable()
    x.dateTime('updatedOn').notNullable()
    x.primary(['siteId', 'consumableId', 'days'])
  })
  
  await knex.schema.createTable('IssueStatusSeverity', issueStatusSeverity => {
    issueStatusSeverity.increments('id')
    issueStatusSeverity.string('name').notNullable()
    issueStatusSeverity.string('i18nKey').notNullable()
    issueStatusSeverity.string('externalId').notNullable()
    issueStatusSeverity
      .integer('sortOrder')
      .unsigned()
      .notNullable()
    issueStatusSeverity.charset('utf8')
  })

  await knex('IssueStatusSeverity').insert({
    name: 'High',
    i18nKey: 'issueStatusSeverityHigh',
    externalId: 'High',
    sortOrder: 0,
  })

  await knex('IssueStatusSeverity').insert({
    name: 'Medium',
    i18nKey: 'issueStatusSeverityMedium',
    externalId: 'Medium',
    sortOrder: 1,
  })

  const [issueStatusSeverityIdLow] = await knex('IssueStatusSeverity').insert({
    name: 'Low',
    i18nKey: 'issueStatusSeverityLow',
    externalId: 'Low',
    sortOrder: 2,
  })

  await knex.schema.table('IssueStatus', issueStatus => {
    issueStatus
      .integer('issueStatusSeverityId')
      .unsigned()
      .notNullable()
      .defaultTo(issueStatusSeverityIdLow)
      .references('id')
      .inTable('IssueStatusSeverity')
    issueStatus
      .integer('sortOrder')
      .unsigned()
      .notNullable()
      .defaultTo(0)
  })
}

async function down(knex) {
  
  await knex.schema.table('Partner', x => {
    x.dropColumns('dueDaysInventoryStockout', 'dueDaysInventoryStockExpiring')
  })

  await knex.schema.dropTableIfExists('FactInventoryConsumptionRate')
  
  await knex.schema.table('IssueStatus', issueStatus => {
    issueStatus.dropForeign('issueStatusSeverityId')
    issueStatus.dropColumns('issueStatusSeverityId')
    issueStatus.dropColumns('sortOrder')
  })

  await knex.schema.dropTableIfExists('IssueStatusSeverity')
}
