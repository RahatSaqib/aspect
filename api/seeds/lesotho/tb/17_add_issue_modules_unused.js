const addIssueUnusedModules = require('../../common/20201116_add_issue_modules_unused')
const { adminUserName, partnerName } = require('./fixtures/partnerData')

module.exports = require('../../utils').seed(async knex => {
  await addIssueUnusedModules(knex, [], partnerName, adminUserName)
}, __filename)
