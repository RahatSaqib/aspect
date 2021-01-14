const cleanPermissions = require('../../common/clean_permissions')
const jobFunctionFixture = require('../shared/fixtures/jobFunctions')

module.exports = require('../../utils').seed(seed, __filename)

async function seed(knex) {
  await cleanPermissions(knex, 'Lesotho HIV', jobFunctionFixture)
}
