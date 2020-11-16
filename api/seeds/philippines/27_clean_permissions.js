const cleanPermissions = require('../common/clean_permissions')
const jobFunctionsFixture = require('./fixtures/jobFunctions')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await cleanPermissions(knex, 'Philippines', jobFunctionsFixture)
}
