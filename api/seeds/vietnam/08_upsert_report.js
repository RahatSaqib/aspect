const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('../mozambique/fixtures/jobFunctions')
const { partnerName } = require('../mozambique/fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex =>
    updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerName),
  __filename
)
