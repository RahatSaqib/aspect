module.exports = require('../../utils').seed(seed, __filename)
const { upsertJobFunctionFixture } = require('../../common')
const fixture = require('../shared/fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const { getPartnerByExternalId } = require('../../utils')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  await upsertJobFunctionFixture(knex, fixture, partnerId)
}
