module.exports = require('../utils').seed(seed, __filename)

const { getPartnerByExternalId } = require('../utils')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const { upsertJobFunctionFixture } = require('../common')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  await upsertJobFunctionFixture(knex, jobFunctionFixture, partnerId)
}
