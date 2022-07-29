const { partnerName, plugin } = require('./fixtures/partnerData')
const { getPartnerByName } = require('../utils')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)

  await knex('Partner').where({ id: partnerId }).update({
    plugin,
  })
}
