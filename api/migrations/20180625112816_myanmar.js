module.exports = require('../src/db').migration(up, down)

async function up(knex) {
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
  await knex.schema.table('IssueStatus', issueStatus => {
    issueStatus.dropForeign('issueStatusSeverityId')
    issueStatus.dropColumns('issueStatusSeverityId')
    issueStatus.dropColumns('sortOrder')
  })

  await knex.schema.dropTableIfExists('IssueStatusSeverity')
}
