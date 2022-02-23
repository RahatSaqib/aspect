const seedModuleDisabledIssue = require('../common/20200902_add_issue_module_disabled')
const partnerData = require('./fixtures/partnerVariables')

module.exports = require('../utils').seed(
  async knex => seedModuleDisabledIssue(knex, partnerData),
  __filename
)
