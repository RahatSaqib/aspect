module.exports = require('../utils').seed(seed, __filename)
const { upsertJobFunctionFixture } = require('../common')
const fixture = require('./fixtures/jobFunctions')
const { partnerName } = require('./fixtures/partnerData')
const { getPartnerByName } = require('../utils')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertJobFunctionFixture(knex, fixture, partnerId)
}
