const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const upsertIssueEventTrigger = require('../../common/upsert_issue_event_triggers')

module.exports = require('../../utils').seed(async knex => upsertIssueEventTrigger(knex, partnerExternalId), __filename)
