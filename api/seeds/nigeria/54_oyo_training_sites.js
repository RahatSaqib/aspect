module.exports = require('../utils').seed(seed, __filename)

const { sites } = require('./fixtures/sites.json')
const { insertSites } = require('../utils')
const partnerData = require('./fixtures/partnerData')
const deduplicateStatesAndLgas = require('../common/20220308_deduplicate_states_and_lgas')

async function seed(knex) {
  const { id: countryId } = await knex('Country').where({ abbreviation: partnerData.partnerAbbreviation }).first()
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerData.partner.externalId }).first()
  await insertSites(knex, partnerId, countryId, sites)

  await deduplicateStatesAndLgas(knex, countryId)
}
