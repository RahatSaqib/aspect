const { partnerName, adminUserName } = require('./fixtures/partnerData')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')
const { seedIssueType } = require('../utils')
module.exports = require('../utils').seed(async knex => {
  await seedIssueType(knex, 'SyringePressureTooHighModule', {
    userName: adminUserName,
  })
  await upsertIssueEventTrigger(knex, partnerName)
}, __filename)
