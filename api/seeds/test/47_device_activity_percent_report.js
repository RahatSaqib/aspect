const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions_partnerOne')
const { partnerName } = require('./fixtures/partnerVariables')

module.exports = require('../utils').seed(
  async knex =>
    updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerName),
  __filename
)
