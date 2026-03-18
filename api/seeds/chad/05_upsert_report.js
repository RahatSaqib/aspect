const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const reportFixture = require('./fixtures/reports')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex =>
    updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerExternalId, {
      countrySpecificReportFixture: reportFixture,
    }),
  __filename
)
