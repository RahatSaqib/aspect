const upsertTags = require('../common/upsert_tags')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const { externalId: partnerExternalId } = partnerData.partner
  await upsertTags(knex, partnerExternalId)
}

module.exports = require('../utils').seed(seed, __filename)
