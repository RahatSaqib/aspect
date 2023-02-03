const partnerData = require('./fixtures/partnerData')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')
const upsertIssueModuleDisabled = require('../common/20200902_add_issue_module_disabled')

module.exports = require('../utils').seed(async knex => {
  await upsertIssueModuleDisabled(knex, partnerData)
  await upsertIssueEventTrigger(knex, partnerData.partnerName)
}, __filename)
