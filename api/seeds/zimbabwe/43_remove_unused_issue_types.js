const upsertIssueTypes = require('../common/remove_unused_issues')
const { adminUserName, partnerName } = require('./fixtures/partnerData')
module.exports = require('../utils').seed(knex => upsertIssueTypes(knex, adminUserName, partnerName), __filename)
