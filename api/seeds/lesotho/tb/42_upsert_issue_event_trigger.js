const { partnerName } = require('./fixtures/partnerVariables.json')
const upsertIssueEventTrigger = require('../../common/upsert_issue_event_triggers')

module.exports = require('../../utils').seed(
  async knex => upsertIssueEventTrigger(knex, partnerName),
  __filename
)
