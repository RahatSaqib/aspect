const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions_partnerOne')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerExternalId),
  __filename
)
