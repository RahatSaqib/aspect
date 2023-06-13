const upsertTags = require('../common/upsert_tags')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const { partner } = partnerData
  await upsertTags(knex, partner.externalId)
}

module.exports = require('../utils').seed(seed, __filename)
