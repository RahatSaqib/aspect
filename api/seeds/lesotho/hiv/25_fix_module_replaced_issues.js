const cleanModuleReplaced = require('../../common/clean_module_replaced_issues')
const { partnerName, adminUserName } = require('./fixtures/partnerVariables')
module.exports = require('../../utils').seed(
  async knex => cleanModuleReplaced(knex, adminUserName, partnerName),
  __filename
)
