const {
  partner: { externalId: partnerExternalId },
  plugin,
} = require('./fixtures/partnerData')
const { getPartnerByExternalId } = require('../utils')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  await knex('Partner').where({ id: partnerId }).update({
    plugin,
  })
}
