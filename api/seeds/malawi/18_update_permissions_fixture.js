const { upsertJobFunctionFixture } = require('../common')
const { partnerName } = require('./fixtures/partnerData')
const { getPartnerByName } = require('../utils')

module.exports = require('../utils').seed(seed, __filename)
const jobFunctions = require('./fixtures/jobFunctions')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)

  await upsertJobFunctionFixture(knex, jobFunctions, partnerId)
}
