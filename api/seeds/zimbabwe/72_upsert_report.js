const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const countrySpecificReportFixture = require('./fixtures/reports')

module.exports = require('../utils').seed(
  async knex =>
    updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerExternalId, {
      countrySpecificReportFixture,
    }),
  __filename
)
