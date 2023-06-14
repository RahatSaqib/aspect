const updateReportsAndJobFunctions = require('../../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('../shared/fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

module.exports = require('../../utils').seed(
  async knex => updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerExternalId),
  __filename
)
