const {
  upsertJobFunctionFixture,
  upsertPermissionFixture,
} = require('../common')
const jobFunctionsFixtureDefault = require('../fixtures/jobFunctions')
const { getPartnerByName } = require('../utils')

module.exports = async (knex, partnerData) => {
  const { partnerName, fixtures } = partnerData
  const { jobFunctions = jobFunctionsFixtureDefault } = fixtures
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertPermissionFixture(knex)
  await upsertJobFunctionFixture(knex, jobFunctions, partnerId)
}
