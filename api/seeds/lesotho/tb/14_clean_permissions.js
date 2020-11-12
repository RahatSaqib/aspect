module.exports = require('../../utils').seed(seed, __filename)

const { upsertJobFunctionFixture, upsertPermissionFixture } = require('../../common')
const { getPartnerByName } = require('../../utils')
const jobFunctionsFixture = require('../../common/fixtures/jobFunctions.json')

async function seed(knex) {
  await upsertPermissionFixture(knex)
  const { id: partnerId } = await getPartnerByName(knex, 'Lesotho TB')
  await upsertJobFunctionFixture(knex, jobFunctionsFixture, partnerId)
}
