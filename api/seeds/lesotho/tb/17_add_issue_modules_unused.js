const addIssueUnusedModules = require('../../common/20201116_add_issue_modules_unused')
const { adminName, partnerName } = require('./fixtures/partnerVariables')

module.exports = require('../../utils').seed(async knex => {
  await addIssueUnusedModules(knex, [], partnerName, adminName)
}, __filename)
