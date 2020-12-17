const upsertIssueTypes = require('../common/20201216_remove_unused_issues')
const { adminUserName, partnerName } = require('./fixtures/partnerData')
module.exports = require('../utils').seed(
  knex => upsertIssueTypes(knex, adminUserName, partnerName),
  __filename
)
