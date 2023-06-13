const cleanModuleReplaced = require('../../common/clean_module_replaced_issues')
const {
  partner: { externalId: partnerExternalId },
  adminUserName,
} = require('./fixtures/partnerData')
module.exports = require('../../utils').seed(
  async knex => cleanModuleReplaced(knex, adminUserName, partnerExternalId),
  __filename
)
