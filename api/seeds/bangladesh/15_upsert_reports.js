module.exports = require('../utils').seed(seed, __filename)

const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const { partnerName } = require('./fixtures/partnerData')
const additionalReportFixture = require('./fixtures/Report')

async function seed(knex) {
  await updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerName, {
    additionalReportFixture,
  })
}
