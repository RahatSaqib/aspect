const { partnerName } = require('./fixtures/partnerData')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')

module.exports = require('../utils').seed(async knex => {
  await upsertIssueEventTrigger(knex, partnerName)
}, __filename)
