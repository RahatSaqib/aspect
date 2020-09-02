module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('IssueEventTrigger', issueEventTrigger => {
    issueEventTrigger.json('filterIssueCondition').after('triggerConditions')
  })
}

async function down(knex) {
  await knex.schema.alterTable('IssueEventTrigger', issueEventTrigger => {
    issueEventTrigger.dropColumns('filterIssueCondition')
  })
}
