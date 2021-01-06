const addIssueUnusedModules = require('../common/20201116_add_issue_modules_unused')

module.exports = require('../utils').seed(async knex => {
  await addIssueUnusedModules(knex, ['admin'], 'Partner One', 'admin')
}, __filename)
