const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const { partner } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => updateReportsAndJobFunctions(knex, jobFunctionFixture, partner.externalId),
  __filename
)
