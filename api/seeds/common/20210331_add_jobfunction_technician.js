const { upsertJobFunctionFixture } = require('../common')
const { getPartnerByExternalId } = require('../utils')
const { labUser, technician } = require('../fixtures/jobFunctionBase')

module.exports = async (knex, partnerExternalId, jobFunctionFixture) => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  /**
   * Make sure `labUser` and `technician` job functions exist in db.
   * They are needed to process `configurationData` - see
   * func tryAssignLabTechnicianToSite in api/src/deviceApi/device.js
   */
  let jobFunctions = [...jobFunctionFixture]
  if (!jobFunctionFixture.find(({ name }) => name === 'Lab User')) {
    jobFunctions = [...jobFunctions, labUser]
  }
  if (!jobFunctionFixture.find(({ name }) => name === 'Technician')) {
    jobFunctions = [...jobFunctions, technician]
  }
  await upsertJobFunctionFixture(knex, jobFunctions, partnerId)
}
