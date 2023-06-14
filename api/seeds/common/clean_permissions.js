const { upsertJobFunctionFixture, upsertPermissionFixture } = require('../common')
const { getPartnerByExternalId } = require('../utils')
const defaultJobFunctionsFixture = require('../fixtures/jobFunctions')

module.exports = async function cleanPermissions(
  knex,
  partnerExternalId,
  jobFunctionsFixture = defaultJobFunctionsFixture
) {
  await upsertPermissionFixture(knex)
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  await upsertJobFunctionFixture(knex, jobFunctionsFixture, partnerId)
}
