module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunctionFixture, upsertPermissionFixture } = require('../common')
const { getPartnerByName } = require('../utils')
const jobFunctionsFixture = require('./fixtures/jobFunctions')

async function seed(knex) {
  await upsertPermissionFixture(knex)
  const { id: partnerId } = await getPartnerByName(knex, 'Philippines')
  await upsertJobFunctionFixture(knex, jobFunctionsFixture, partnerId)
}
