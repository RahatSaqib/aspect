const { upsertJobFunctionFixture, upsertPermissionFixture } = require('../common')
const { getPartnerByName } = require('../utils')
const jobFunctionsFixture = require('../common/fixtures/jobFunctions')

module.exports = async function cleanPermissions(knex, partnerName) {
  await upsertPermissionFixture(knex)
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertJobFunctionFixture(knex, jobFunctionsFixture, partnerId)
}
