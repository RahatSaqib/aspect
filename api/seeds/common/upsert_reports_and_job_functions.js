const upsertReports = require('./upsert_reports')
const { upsertJobFunctionFixture } = require('../common')

/**
 * Upsert function for updating reports and job functions. It's recommended to use this function if you need to update reports and also their accessibility, which is set in the job functions fixtures.
 */
module.exports = async function upsertReportsAndJobFunctions(
  knex,
  jobFunctionFixture,
  partnerExternalId,
  { countrySpecificReportFixture } = {}
) {
  const [partnerId] = await knex('Partner').where({ externalId: partnerExternalId }).pluck('id')
  await upsertReports(knex, countrySpecificReportFixture)
  await upsertJobFunctionFixture(knex, jobFunctionFixture, partnerId)
}
