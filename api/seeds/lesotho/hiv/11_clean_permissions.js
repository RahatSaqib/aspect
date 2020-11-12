const cleanPermissions = require('../../common/20201112_clean_permissions')

module.exports = require('../../utils').seed(seed, __filename)

async function seed(knex) {
  await cleanPermissions(knex, 'Lesotho HIV')
}
