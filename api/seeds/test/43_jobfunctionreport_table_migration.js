const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const jobFunctionFixturePartnerOne = require('./fixtures/jobFunctions_partnerOne')
const jobFunctionFixturePartnerTwo = require('./fixtures/jobFunctions_partnerTwo')

module.exports = require('../utils').seed(async knex => {
  await updateReportsAndJobFunctions(knex, jobFunctionFixturePartnerOne, 'partnerOne')
  await updateReportsAndJobFunctions(knex, jobFunctionFixturePartnerTwo, 'partnerTwo')
}, __filename)
