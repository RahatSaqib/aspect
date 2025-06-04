const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const jobFunctionsFixturePartnerOne = require('./fixtures/jobFunctions_partnerOne')
const jobFunctionsFixturePartnerTwo = require('./fixtures/jobFunctions_partnerTwo')

module.exports = require('../utils').seed(async knex => {
  await updateReportsAndJobFunctions(knex, jobFunctionsFixturePartnerOne, 'partnerOne')
  await updateReportsAndJobFunctions(knex, jobFunctionsFixturePartnerTwo, 'partnerTwo')
}, __filename)
