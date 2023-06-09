const { upsertJobFunctionFixture } = require('../common')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const { getPartnerByExternalId } = require('../utils')

module.exports = require('../utils').seed(seed, __filename)
const jobFunctions = require('./fixtures/jobFunctions')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  await upsertJobFunctionFixture(knex, jobFunctions, partnerId)
}
