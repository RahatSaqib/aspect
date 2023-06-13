const upsertTags = require('../common/upsert_tags')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

async function seed(knex) {
  await upsertTags(knex, partnerExternalId)
}

module.exports = require('../utils').seed(seed, __filename)
