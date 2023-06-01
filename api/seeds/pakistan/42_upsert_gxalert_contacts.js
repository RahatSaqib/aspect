const contacts = require('./fixtures/contactsFromGxAlert.json')
const partnerData = require('./fixtures/partnerData')
const upsertContacts = require('../common/upsert_contacts')

async function seed(knex) {
  await upsertContacts(knex, partnerData, contacts)
}

module.exports = require('../utils').seed(seed, __filename)
