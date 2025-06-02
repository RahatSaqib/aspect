module.exports = require('../utils').seed(seed, __filename)

const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const reports = require('./fixtures/reports')

async function seed(knex) {
  await updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerExternalId, {
    countrySpecificReportFixture: reports,
  })
}
