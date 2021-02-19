const cleanModuleReplaced = require('../common/clean_module_replaced_issues')

module.exports = require('../utils').seed(async knex => {
  await cleanModuleReplaced(knex, 'admin', 'Partner One')
  await cleanModuleReplaced(knex, 'admin', 'Partner Two')
}, __filename)
