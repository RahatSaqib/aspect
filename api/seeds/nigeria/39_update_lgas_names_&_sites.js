module.exports = require('../utils').seed(seed, __filename)

const { sites } = require('./fixtures/sites.json')
const { insertSites } = require('../utils')
const partnerData = require('./fixtures/partnerData')
const { countries } = require('./fixtures/geography.json')
const { upsertStatesAndLgas } = require('../common')

async function seed(knex) {
  await knex('Lga').where({ name: 'Oyo' }).update({ name: 'Oyo West' })
  await knex('Lga').where({ name: 'Emuoha' }).update({ name: 'Emohua' })
  const { states } = countries[0]
  const { id: countryId } = await knex('Country').where({ abbreviation: partnerData.partnerAbbreviation }).first()
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerData.partner.externalId }).first()
  await upsertStatesAndLgas(knex, countryId, states)
  await insertSites(knex, partnerId, countryId, sites)
}
