const upsertTags = require('../../common/upsert_tags')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const {
    partner: { externalId: partnerExternalId },
  } = partnerData
  await upsertTags(knex, partnerExternalId)
}

module.exports = require('../../utils').seed(seed, __filename)
