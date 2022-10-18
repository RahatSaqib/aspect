module.exports = require('../utils').seed(seed, __filename)

const contacts = require('./fixtures/contacts.json')
const partnerData = require('./fixtures/partnerData')
const upsertContacts = require('../common/upsert_contacts')

async function seed(knex) {
  await upsertContacts(knex, partnerData, contacts)
}
