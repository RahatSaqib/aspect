const cleanPermissions = require('../common/clean_permissions')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await cleanPermissions(knex, 'Ukraine')
}
