const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const { partnerName } = require('./fixtures/partnerData')
const countrySpecificReportFixture = require('./fixtures/reports')

module.exports = require('../utils').seed(
  async knex =>
    updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerName, {
      countrySpecificReportFixture,
    }),
  __filename
)
