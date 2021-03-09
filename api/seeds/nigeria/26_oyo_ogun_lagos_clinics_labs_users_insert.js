module.exports = require('../utils').seed(seed, __filename)

const { sites } = require('./fixtures/sites.json')
const { insertSites } = require('../utils')
const contacts = require('./fixtures/contacts.json')
const partnerData = require('./fixtures/partnerData')
const upsertContacts = require('../common/upsert_contacts')
const geography = require('./fixtures/geography.json')
const { upsertStatesAndLgas } = require('../common')

async function seed(knex) {

  const { id: countryId } = await knex('Country')
    .where('name', 'Nigeria')
    .first('id')

  await upsertStatesAndLgas(knex, countryId, geography.countries[0].states)

  const { id: partnerId } = await knex('Partner')
    .where('name', partnerData.partnerName)
    .first('id')

  await insertSites(knex, partnerId, countryId, sites)
  await upsertContacts(knex, partnerData, contacts)
}
