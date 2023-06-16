const { upsertJobFunctionFixture, upsertPermissionFixture } = require('../common')
const jobFunctionsFixtureDefault = require('../fixtures/jobFunctions')
const { getPartnerByExternalId } = require('../utils')

module.exports = async (knex, partnerData) => {
  const {
    partner: { externalId: partnerExternalId },
    fixtures,
  } = partnerData
  const { jobFunctions = jobFunctionsFixtureDefault } = fixtures
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  await upsertPermissionFixture(knex)
  await upsertJobFunctionFixture(knex, jobFunctions, partnerId)
}
