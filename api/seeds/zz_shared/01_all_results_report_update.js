const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
// eslint-disable-next-line import/no-dynamic-require
const jobFunctionFixture = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/jobFunctions`)
// // eslint-disable-next-line import/no-dynamic-require
// eslint-disable-next-line import/no-dynamic-require
const { partnerName } = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)

module.exports = require('../utils').seed(
  async knex =>
    updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerName),
  __filename
)
