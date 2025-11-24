const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
/* eslint-disable import/no-dynamic-require */
const {
  partner: { externalId: partnerExternalId },
  fixtures: { jobFunctions: jobFunctionFixture },
} = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = require('../utils').seed(
  async knex => updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerExternalId),
  __filename
)
