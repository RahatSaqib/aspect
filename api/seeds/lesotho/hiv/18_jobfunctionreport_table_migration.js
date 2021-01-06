const updateReportsAndJobFunctions = require('../../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('../shared/fixtures/jobFunctions')
const { partnerName } = require('./fixtures/partnerVariables')

module.exports = require('../../utils').seed(
  knex => updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerName),
  __filename
)
