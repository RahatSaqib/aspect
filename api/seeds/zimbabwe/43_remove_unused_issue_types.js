const upsertIssueTypes = require('../common/remove_unused_issues')
const {
  adminUserName,
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
module.exports = require('../utils').seed(knex => upsertIssueTypes(knex, adminUserName, partnerExternalId), __filename)
