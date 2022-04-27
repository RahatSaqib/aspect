const {
  upsertJobFunctionFixture,
  upsertPermissionFixture,
} = require('../common')

/* eslint-disable import/no-dynamic-require */
const { partnerName } = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)

const jobFunctionFixture = require('../fixtures/jobFunctions')
const { getPartnerByName } = require('../utils')
module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertPermissionFixture(knex)
  await upsertJobFunctionFixture(knex, jobFunctionFixture, partnerId)
}, __filename)
