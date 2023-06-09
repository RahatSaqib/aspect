const upsertTags = require('../common/upsert_tags')
const { partner } = require('./fixtures/partnerData')

async function seed(knex) {
  const { externalId: partnerExternalId } = partner
  await upsertTags(knex, partnerExternalId)
}

module.exports = require('../utils').seed(seed, __filename)
