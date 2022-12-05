const { partnerName } = require('./fixtures/partnerData')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')
const issueEventTriggerFixture = require('./fixtures/issueEventTrigger')
const migrateOldFashionNotificationType = require('../common/migrate_notification_type_shape')

module.exports = require('../utils').seed(async knex => {
  await upsertIssueEventTrigger(knex, partnerName, issueEventTriggerFixture)
  await migrateOldFashionNotificationType(knex)
}, __filename)
