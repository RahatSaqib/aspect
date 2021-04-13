const { upsertJobFunctionFixture } = require('../common')
const { getPartnerByName } = require('../utils')
const { labUser, technician } = require('../fixtures/jobFunctionBase')

module.exports = async (knex, partnerName, jobFunctionFixture) => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)

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
