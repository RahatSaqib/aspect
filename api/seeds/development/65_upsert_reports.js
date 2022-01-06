module.exports = require('../utils').seed(seed, __filename)

const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
const jobFunctionsFixturePartnerOne = require('./fixtures/jobFunctions_partnerOne')
const additionalReportFixture = require('./fixtures/Report')

async function seed(knex) {
  await updateReportsAndJobFunctions(
    knex,
    jobFunctionsFixturePartnerOne,
    'Partner One',
    {
      additionalReportFixture,
    }
  )
}
