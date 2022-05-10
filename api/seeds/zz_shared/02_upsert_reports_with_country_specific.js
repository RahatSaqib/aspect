/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')

const { partnerName, fixtures } = require(`../${process.env[
  'seeds.directory'
].replace('./seeds/', '')}/fixtures/partnerData`)
const relativeReportPath = `../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/reports.js`
const absolutePath = `${__dirname}${relativeReportPath.substring(2)}`.replace(
  '/zz_shared',
  ''
)
function exists(path) {
  return fs.existsSync(path)
}
module.exports = require('../utils').seed(async knex => {
  const { jobFunctions } = fixtures
  const countrySpecificReportFixture = (await exists(absolutePath))
    ? require(relativeReportPath)
    : {}
  await updateReportsAndJobFunctions(knex, jobFunctions, partnerName, {
    countrySpecificReportFixture,
  })
}, __filename)
