const { upsertJobFunctionFixture, upsertPermissionFixture } = require('../common')
const { getPartnerByName } = require('../utils')
const defaultJobFunctionsFixture = require('../fixtures/jobFunctions')

module.exports = async function cleanPermissions(knex, partnerName, jobFunctionsFixture = defaultJobFunctionsFixture) {
  await upsertPermissionFixture(knex)
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertJobFunctionFixture(knex, jobFunctionsFixture, partnerId)
}
