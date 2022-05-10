const upsertJobFunctionsAndPermissions = require('../common/upsert_job_functions_&_permissions')

/* eslint-disable import/no-dynamic-require */
const partnerData = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)

module.exports = require('../utils').seed(
  async knex => upsertJobFunctionsAndPermissions(knex, partnerData),
  __filename
)
