// const { addTimestamps } = require('./utils/index')
const { addUniqueKey, dropUniqueKey } = require('../seeds/utils')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await addUniqueKey(knex, 'IssueResolutionTrigger')
  await addUniqueKey(knex, 'IssueEscalationTrigger')
  await addUniqueKey(knex, 'NotificationType')
}

async function down(knex) {
  await dropUniqueKey(knex, 'IssueResolutionTrigger')
  await dropUniqueKey(knex, 'IssueEscalationTrigger')
  await dropUniqueKey(knex, 'NotificationType')
}
