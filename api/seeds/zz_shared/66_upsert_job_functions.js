/* eslint-disable import/no-dynamic-require */
const { upsertJobFunctionFixture } = require('../common')
const { getPartnerByExternalId } = require('../utils')

const { partner, fixtures } = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)
const generalJobFunctions = require(`../fixtures/jobFunctions`)

module.exports = require('../utils').seed(async knex => {
  const { jobFunctions = generalJobFunctions } = fixtures || {}
  const { id: partnerId } = await getPartnerByExternalId(knex, partner.externalId)
  await upsertJobFunctionFixture(knex, jobFunctions, partnerId)
}, `${__filename}-${new Date().toISOString()}`)
