/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')

const { partner, fixtures } = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)
const relativeReportPath = `../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/reports.js`
const absolutePath = `${__dirname}${relativeReportPath.substring(2)}`.replace(/(\/|\\)zz_shared/, '')
function exists(path) {
  return fs.existsSync(path)
}
module.exports = require('../utils').seed(async knex => {
  const { jobFunctions } = fixtures
  const countrySpecificReportFixture = (await exists(absolutePath)) ? require(relativeReportPath) : {}
  await updateReportsAndJobFunctions(knex, jobFunctions, partner.externalId, {
    countrySpecificReportFixture,
  })
}, `${__filename}-${new Date().toISOString()}`)
