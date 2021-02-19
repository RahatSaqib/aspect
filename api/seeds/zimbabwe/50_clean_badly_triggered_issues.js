const cleanModuleReplaced = require('../common/clean_module_replaced_issues')

module.exports = require('../utils').seed(
  async knex => cleanModuleReplaced(knex),
  __filename
)
