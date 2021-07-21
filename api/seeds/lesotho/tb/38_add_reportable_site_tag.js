const upsertTags = require('../../common/upsert_tags')
const partnerData = require('./fixtures/partnerVariables.json')

async function seed(knex) {
  const { partnerName } = partnerData
  await upsertTags(knex, partnerName)
}

module.exports = require('../../utils').seed(seed, __filename)
