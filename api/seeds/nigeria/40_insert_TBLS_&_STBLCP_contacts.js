module.exports = require('../utils').seed(seed, __filename)

const contacts = require('./fixtures/contacts.json')
const upsertContacts = require('../common/upsert_contacts')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  await upsertContacts(knex, partnerData, contacts)
}
